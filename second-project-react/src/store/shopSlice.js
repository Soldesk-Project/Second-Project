import { createSlice } from '@reduxjs/toolkit';

const shopSlice = createSlice({
  name: 'shop',
  initialState: { items: [] },
  reducers: {
    setShopItems(state, action) {
      state.items = action.payload;
    },
  },
});

export const { setShopItems } = shopSlice.actions;
export default shopSlice.reducer;