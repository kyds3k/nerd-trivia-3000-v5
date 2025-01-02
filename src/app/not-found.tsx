// /app/404/page.js
import Head from 'next/head';
import Image from 'next/image';

const Custom404 = () => {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="flex flex-col w-screen h-screen justify-center items-center">
        <h1 className="text-4xl">404 - Page Not Found</h1>
        <Image
          src="https://media.tenor.com/c5IcstNiwGUAAAAj/mythikore-anime-girl.gif"
          width={200}
          height={200}
          alt="anime girl saying no"
          className='mb-10'
        />
        <div className="text-3xl text-center">
          <p>The page you are looking for does not exist.</p>
          <a href="/" className="text-blue-400" >
            Go back to Home
          </a>
        </div>
      </div>
    </>
  );
};

export default Custom404;
