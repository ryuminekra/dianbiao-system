import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Metric {
  _id: string;
  device_id: string;
  value: number;
  timestamp: string;
  month: string;
}

interface MetricState {
  metrics: Metric[];
  loading: boolean;
  error: string | null;
}

const initialState: MetricState = {
  metrics: [],
  loading: false,
  error: null,
};

const metricSlice = createSlice({
  name: 'metric',
  initialState,
  reducers: {
    setMetrics: (state, action: PayloadAction<Metric[]>) => {
      state.metrics = action.payload;
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

export const { setMetrics, setLoading, setError } = metricSlice.actions;
export default metricSlice.reducer;