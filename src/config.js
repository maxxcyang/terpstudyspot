const config = {
  dailyCoApiKey: process.env.REACT_APP_DAILY_CO_API || '',
};

// Debug logging
console.log('Daily.co API Key loaded:', process.env.REACT_APP_DAILY_CO_API ? 'Yes' : 'No');

export default config; 