import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isTop10: false,
  refreshRanking: false,
};

const rankingSlice = createSlice({
  name: 'ranking',
  initialState,
  reducers: {
    setIsTop10: (state, action) => {
      state.isTop10 = action.payload;
    },
    triggerRefreshRanking: (state) => {
      state.refreshRanking = !state.refreshRanking;
    }
  },
});

export const { setIsTop10, triggerRefreshRanking } = rankingSlice.actions;
export default rankingSlice.reducer;
