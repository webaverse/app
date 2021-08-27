import Head from 'next/head';
// import Image from 'next/image';
// import styles from '../styles/Home.module.css';
// <div className={styles.container}>

export default function Home() {
  return (
    <div>
      <Head>
        <title>App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{process.env.NODE_ENV}</div>
      <iframe src="editor.html" />
    </div>
  )
}
