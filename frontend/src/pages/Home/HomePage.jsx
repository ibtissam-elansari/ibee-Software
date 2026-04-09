import React, { useState } from 'react'
import { Star } from 'lucide-react'
import StatusField from './components/StatusField';
import HivesField from './components/HivesField';


const HomePage = () => {
  return (
    <>
      <StatusField/>
      <HivesField />
    </>
  );
}

export default HomePage
