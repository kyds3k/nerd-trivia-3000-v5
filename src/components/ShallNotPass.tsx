import React from 'react';
import { Image } from '@nextui-org/react';
import Link from 'next/link';
import { Button } from '@nextui-org/react';



export default function ShallNotPass() {
  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen">
      <Image 
        src="https://media.tenor.com/c5IcstNiwGUAAAAj/mythikore-anime-girl.gif" 
        width={200} 
        height={200} 
        alt="anime girl saying no" 
      />
      <h1 className="text-3xl my-4">You need to be logged in as an admin to access this page.</h1>
      <Button as={Link} href="/">Go back to the homepage</Button>
    </div>
  );
};

