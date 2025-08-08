import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const cats = ['테두리','칭호','글자색','명함','말풍선', '유니크'];
const queryString = cats.map(cat => `category=${encodeURIComponent(cat)}`).join('&');

export const fetchUserItems = () => async (dispatch) => {
  try {
    const response = await axios.get(`/api/shop/items/all?${queryString}`);
    const items = response.data.map(it => ({
      ...it,
      imgUrl: it.imageFileName ? `/images/${it.imageFileName}` : ''
    }));
    dispatch(setShopItems(items));
  } catch (error) {
    console.error('아이템 불러오기 실패', error);
  }
};

const shopSlice = createSlice({
  name: 'shop',
  initialState: {
    items: [],
  },
  reducers: {
    setShopItems: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { setShopItems } = shopSlice.actions;
export default shopSlice.reducer;