import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import deviceReducer from './slices/deviceSlice';
import priceReducer from './slices/priceSlice';
import metricReducer from './slices/metricSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    device: deviceReducer,
    price: priceReducer,
    metric: metricReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
