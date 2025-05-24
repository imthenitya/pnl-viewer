import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar(): JSX.Element {
  return (
    <nav className={styles.nav}>
      <ul className={styles.ul}>
        <li>
          <Link href="/" className={styles.link}>
            View P&L
          </Link>
        </li>
        <li>
          <Link href="/chart-prediction" className={styles.link}>
            Chart Prediction
          </Link>
        </li>
      </ul>
    </nav>
  );
}
