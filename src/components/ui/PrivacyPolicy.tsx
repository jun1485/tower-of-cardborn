// 개인정보 처리방침 모달 컴포넌트

import styles from '../../styles/app.module.css';
import { useLanguage, useTranslation } from '../../i18n';
import type { Language } from '../../i18n';
import { useModalKeyboard } from '../../hooks/use-modal-keyboard';

interface PrivacyPolicyProps {
  readonly onClose: () => void;
}

interface PrivacyContent {
  readonly title: string;
  readonly updated: string;
  readonly sections: readonly { readonly title: string; readonly body: string }[];
  readonly contact: string;
}

const PRIVACY_CONTENT: Record<Language, PrivacyContent> = {
  ko: {
    title: '개인정보 처리방침',
    updated: '최종 수정일: 2026-07-10',
    sections: [
      { title: '1. 수집하는 정보', body: 'Tower of Cardborn은 개인정보를 수집·저장·전송하지 않으며 기기 내에서만 실행됩니다.' },
      { title: '2. 로컬 저장소', body: '진행 상태와 설정은 브라우저 localStorage를 사용해 기기에만 저장되며 외부로 전송되지 않습니다.' },
      { title: '3. 네트워크 사용', body: '앱은 외부 서버·분석·광고 네트워크에 연결하지 않으며 INTERNET 권한은 패키지된 웹 에셋 로드에만 사용됩니다.' },
      { title: '4. 제3자 서비스', body: '제3자 SDK·분석·광고·추적 서비스를 사용하지 않습니다.' },
      { title: '5. 아동의 개인정보', body: '아동을 포함한 사용자의 정보를 의도적으로 수집하지 않습니다.' },
      { title: '6. 처리방침 변경', body: '처리방침이 변경되면 앱 내 날짜와 내용을 갱신합니다.' },
      { title: '7. 문의', body: '개인정보 처리방침에 대한 문의는 아래 이메일로 접수할 수 있습니다.' },
    ],
    contact: 'towerofcardborn@gmail.com',
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: 2026-07-10',
    sections: [
      { title: '1. Information We Collect', body: 'Tower of Cardborn does not collect, store, or transmit personal information and runs entirely on the device.' },
      { title: '2. Local Storage', body: 'Game progress and settings are stored only on the device using browser localStorage and are never transmitted externally.' },
      { title: '3. Network Usage', body: 'The app does not connect to external servers, analytics, or advertising networks. The INTERNET permission is used only to load bundled web assets.' },
      { title: '4. Third-Party Services', body: 'The app does not use third-party SDKs, analytics, advertising, or tracking services.' },
      { title: "5. Children's Privacy", body: 'The app does not knowingly collect information from children or other users.' },
      { title: '6. Changes to This Policy', body: 'Policy changes will be reflected in the app with an updated date and content.' },
      { title: '7. Contact', body: 'Questions about this Privacy Policy can be sent to the email address below.' },
    ],
    contact: 'towerofcardborn@gmail.com',
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新：2026-07-10',
    sections: [
      { title: '1. 收集的信息', body: 'Tower of Cardborn 不会收集、存储或传输个人信息，游戏完全在设备上运行。' },
      { title: '2. 本地存储', body: '游戏进度和设置仅通过浏览器 localStorage 保存在设备上，不会传输到外部。' },
      { title: '3. 网络使用', body: '应用不连接外部服务器、分析或广告网络。INTERNET 权限仅用于加载应用内置的网页资源。' },
      { title: '4. 第三方服务', body: '应用不使用第三方 SDK、分析、广告或跟踪服务。' },
      { title: '5. 儿童隐私', body: '应用不会故意收集儿童或其他用户的信息。' },
      { title: '6. 政策变更', body: '如果政策发生变更，应用内将更新日期和内容。' },
      { title: '7. 联系方式', body: '有关本隐私政策的问题可发送至以下邮箱。' },
    ],
    contact: 'towerofcardborn@gmail.com',
  },
};

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const modalRef = useModalKeyboard(onClose);
  const content = PRIVACY_CONTENT[lang];

  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div
        className={styles.policyModal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.policyHeader}>
          <h2 id="privacy-title">{content.title}</h2>
          <button className={styles.policyCloseBtn} aria-label={t('close')} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.policyContent}>
          <p><strong>{content.updated}</strong></p>
          {content.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
          <p><strong>{content.contact}</strong></p>
        </div>
      </div>
    </div>
  );
}
