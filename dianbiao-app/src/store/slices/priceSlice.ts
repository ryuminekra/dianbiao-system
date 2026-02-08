import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ElectricityPrice {
  _id: string;
  area: string;
  price: number;
  is_default: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

interface PriceState {
  prices: ElectricityPrice[];
  loading: boolean;
  error: string | null;
}

const initialState: PriceState = {
  prices: [],
  loading: false,
  error: null,
};

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    setPrices: (state, action: PayloadAction<ElectricityPrice[]>) => {
      state.prices = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setPrices, setLoading, setError } = priceSlice.actions;
export default priceSlice.reducer;