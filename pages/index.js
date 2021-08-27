import Head from 'next/head';
// import Image from 'next/image';
// import styles from '../styles/Home.module.css';
// <div className={styles.container}>

export default function Home() {
  return (
    <div>
      <Head>
        <title>災</title>
        <meta name="description" content="Webaverse virtual world app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{process.env.NODE_ENV}</div>
      <iframe src="editor.html" />
    </div>
  )
}
