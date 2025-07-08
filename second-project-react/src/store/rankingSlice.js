import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isTop10: false,
};

const rankingSlice = createSlice({
  name: 'ranking',
  initialState,
  reducers: {
    setIsTop10: (state, action) => {
      state.isTop10 = action.payload;
    },
  },
});

export const { setIsTop10 } = rankingSlice.actions;
export default rankingSlice.reducer;
