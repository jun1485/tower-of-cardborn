// 개인정보 처리방침 모달 컴포넌트

import styles from '../../styles/app.module.css';

interface PrivacyPolicyProps {
  readonly onClose: () => void;
}

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className={styles.policyOverlay} onClick={onClose}>
      <div className={styles.policyModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.policyHeader}>
          <h2>Privacy Policy</h2>
          <button className={styles.policyCloseBtn} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.policyContent}>
          <p><strong>Last updated:</strong> 2026-03-07</p>

          <h3>1. Information We Collect</h3>
          <p>
            Tower of Cardborn does <strong>not</strong> collect, store, or transmit any personal
            information. The game runs entirely on your device.
          </p>

          <h3>2. Local Storage</h3>
          <p>
            Game progress (selected class, current floor, deck, HP) is saved locally on your
            device using browser localStorage. This data never leaves your device and is not
            accessible to us or any third party.
          </p>

          <h3>3. Network Usage</h3>
          <p>
            The app does not connect to external servers, analytics services, or ad networks.
            The INTERNET permission exists solely for loading bundled web assets within the app.
          </p>

          <h3>4. Third-Party Services</h3>
          <p>
            Tower of Cardborn does not integrate any third-party SDKs, analytics, advertising,
            or tracking services.
          </p>

          <h3>5. Children's Privacy</h3>
          <p>
            We do not knowingly collect any information from children. The game is suitable for
            all ages.
          </p>

          <h3>6. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected
            in the app with an updated date.
          </p>

          <h3>7. Contact</h3>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            <strong>towerofcardborn@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
