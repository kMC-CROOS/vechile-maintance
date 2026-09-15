import React from 'react';
import { Redirect } from 'expo-router';

export default function AddFuelScreen() {
  return <Redirect href="/(tabs)/fuel?openAdd=true" />;
}
