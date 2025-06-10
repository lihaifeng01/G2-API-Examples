import { Outlet, useSearchParams, useModel } from 'umi';
import Nav from '@/components/nav';
import Logo from '@/assets/logo.png';
import { ROLE_NAME } from '@/common';
import { Role } from '@/types';
import { useEffect } from 'react';
import { simd } from 'wasm-feature-detect';
import { pluginWasmUrl } from '@/config';

export default function Layout() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as Role;

  useEffect(() => {
    // 动态添加 <link> 标签进行预加载  WASM 文件
    const preloadWasm = async () => {
      const simdSupported = await simd();
      const wasmUrl = simdSupported ? pluginWasmUrl.simd : pluginWasmUrl.nosimd;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'fetch';
      link.href = wasmUrl;
      link.type = 'application/wasm';
      link.crossOrigin = 'anonymous';
      if (document.head) {
        document.head.appendChild(link);
      } else {
        console.warn('document.head is null', document, document.head);
      }
    };

    preloadWasm();
  }, []);

  const getUserRole = (roleName: Role) => {
    return roleName ? ROLE_NAME[roleName] : '';
  };

  return (
    <>
      <div>
        <Nav logoSrc={Logo} appName='音视频评标' userRole={getUserRole(role)} />
      </div>
      <Outlet />
    </>
  );
}
