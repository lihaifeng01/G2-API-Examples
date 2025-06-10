import React, { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  DatePicker,
  TimePicker,
  Input,
  Select,
  message,
  notification,
  Form,
} from 'antd';
import type { GetProps } from 'antd';
import type { DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import projectInputOutlined from '@/assets/project_input_icon.png';
import dateInputOutlined from '@/assets/date_input_icon.png';
import selectInputOutlined from '@/assets/select_input_icon.png';
import { getRandomInt } from '@/utils';
import dayjs from 'dayjs';
import styles from './index.less';

interface FormValues {
  projectName: string;
  projectDate: string;
  projectTime: string;
  projectExpertNum: string;
}

interface MeetingUrlItem {
  key: string;
  value: string;
}

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

type DisabledTime = (now: Dayjs) => {
  disabledHours?: () => number[];
  disabledMinutes?: (selectedHour: number) => number[];
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
  disabledMilliseconds?: (
    selectedHour: number,
    selectedMinute: number,
    selectedSecond: number,
  ) => number[];
};

const Invite: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [joinMeetingUrlList, setJoinMeetingUrlList] = useState<MeetingUrlItem[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  // 生成专家数量选择项
  const selectItems = Array.from({ length: 20 }, (_, i) => ({
    value: String(i + 1),
    label: `个数: ${i + 1}`,
  }));

  useEffect(() => {
    if (copySuccess) {
      message.success('复制成功');
      // 3秒后重置复制状态
      const timer = setTimeout(() => setCopySuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleReset = () => {
    form.resetFields();
  };

  const generateMeetingUrl = () => {
    form
      .validateFields()
      .then(values => {
        const { projectName, projectDate, projectTime, projectExpertNum } = values;

        const formattedDate = dayjs(projectDate).format('YYYY-MM-DD');
        const formattedTime = dayjs(projectTime).format('HH:mm:ss');
        const baseMeetingUrl = location.href.replace('invite', 'tender');
        const expertBaseMeetingUrl = location.href.replace('invite', 'home');
        const joinMeetingUrlListTemp: MeetingUrlItem[] = [
          {
            key: '评标项目名称: ',
            value: projectName,
          },
          {
            key: '评标时间: ',
            value: `${formattedDate} ${formattedTime}`,
          },
          {
            key: '代理 (主持人) 链接: ',
            value: `${expertBaseMeetingUrl}?cname=${encodeURIComponent(projectName)}&uid=${getRandomInt(1, 1000000)}&role=agent`,
          },
          {
            key: '监督观看链接: ',
            value: `${baseMeetingUrl}?cname=${encodeURIComponent(projectName)}&uid=${getRandomInt(1, 1000000)}&role=supervisor`,
          },
        ];

        // 添加专家链接
        for (let i = 0; i < Number(projectExpertNum); i++) {
          joinMeetingUrlListTemp.push({
            key: `评标专家${i + 1}链接: `,
            value: `${expertBaseMeetingUrl}?cname=${encodeURIComponent(projectName)}&uid=${getRandomInt(1, 1000000)}&role=expert`,
          });
        }

        setJoinMeetingUrlList(joinMeetingUrlListTemp);
        setIsModalOpen(true);
      })
      .catch(() => {
        // 表单验证失败，由 Form 组件自动显示错误
      });
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = joinMeetingUrlList.map(item => `${item.key}\n${item.value}\n\n`).join('');

      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
    } catch (err) {
      console.error('复制失败:', err);
      notification.error({
        message: '复制失败',
        description: '请检查浏览器权限设置',
      });
    }
  };

  const onDateChange: DatePickerProps['onChange'] = (date, dateString) => {
    if (date) {
      setSelectedDate(date as unknown as Dayjs);
      if (date.isSame(dayjs(), 'day') && dateString[1] < dayjs().format('HH:mm:ss')) {
        form.setFieldsValue({ projectTime: undefined });
      }
    } else {
      setSelectedDate(null);
    }
  };

  const disabledDate: RangePickerProps['disabledDate'] = current => {
    return current && current < dayjs().startOf('day');
  };

  const disabledTime: DisabledTime = (now: Dayjs) => {
    const isToday = selectedDate && selectedDate.isSame(dayjs(), 'day');

    if (!isToday) {
      return {};
    }

    return {
      disabledHours: () => {
        const hours = [];
        for (let i = 0; i < dayjs().hour(); i++) {
          hours.push(i);
        }
        return hours;
      },
      disabledMinutes: (selectedHour: number) => {
        if (selectedHour === dayjs().hour()) {
          const minutes = [];
          for (let i = 0; i < dayjs().minute(); i++) {
            minutes.push(i);
          }
          return minutes;
        }
        return [];
      },
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.loading}>
          <div className={styles.content}>
            <div className={styles.logo}></div>
            <div className={styles.panel}>
              <div className={styles.title}>远程在线音视频评标室</div>
              <Form form={form} className={styles.form} layout='vertical' requiredMark={false}>
                <Form.Item
                  name='projectName'
                  rules={[{ required: true, message: '请填写评标项目名称' }]}
                >
                  <Input
                    className={styles.input}
                    placeholder='请填写评标项目名称'
                    maxLength={50}
                    prefix={<img src={projectInputOutlined} className={styles.icon} />}
                  />
                </Form.Item>

                <div className={styles['form-row']}>
                  <Form.Item
                    name='projectDate'
                    rules={[{ required: true, message: '请选择评标日期' }]}
                    style={{ width: 240, marginBottom: 0 }}
                  >
                    <DatePicker
                      className={styles['date-picker']}
                      placeholder='请选择评标时间'
                      prefix={<img src={dateInputOutlined} className={styles.icon} />}
                      getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                      disabledDate={disabledDate}
                      onChange={onDateChange}
                    />
                  </Form.Item>
                  <Form.Item
                    name='projectTime'
                    rules={[{ required: true, message: '请选择评标时间' }]}
                    style={{ width: 140, marginBottom: 0 }}
                  >
                    <TimePicker
                      className={styles['time-picker']}
                      placeholder='选择时间'
                      getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                      disabledTime={disabledTime}
                    />
                  </Form.Item>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles.label}>评标专家</div>
                  <Form.Item
                    name='projectExpertNum'
                    rules={[{ required: true, message: '请选择评标专家数目' }]}
                    style={{ width: 324, marginBottom: 0 }}
                  >
                    <Select
                      className={styles.select}
                      placeholder='请选择专家数量'
                      options={selectItems}
                      getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                      prefix={<img src={selectInputOutlined} className={styles.icon} />}
                    />
                  </Form.Item>
                </div>
              </Form>

              <div className={styles.buttons}>
                <Button
                  className={styles['btn-primary']}
                  type='primary'
                  onClick={generateMeetingUrl}
                >
                  生成评标入会链接
                </Button>
                {/* <Button className={styles['btn-default']} onClick={handleReset}>
                  重置
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={<div className={styles['modal-title']}>评标会议信息及入会链接</div>}
        width={560}
        centered
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <div className={styles['modal-body']}>
          <div className={styles['modal-content']}>
            {joinMeetingUrlList.length > 0 ? (
              joinMeetingUrlList.map(item => (
                <div className={styles['modal-item']} key={item.key + item.value}>
                  <div className={styles['item-key']}>{item.key}</div>
                  <div className={styles['item-value']}>{item.value}</div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>数据加载中或为空</div>
            )}
          </div>
          <Button
            className={styles['copy-btn']}
            type='primary'
            onClick={copyToClipboard}
            disabled={copySuccess}
          >
            {copySuccess ? '已复制' : '一键复制'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Invite;
