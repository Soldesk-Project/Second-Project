import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import rankingReducer from './rankingSlice';
import shopReducer from './shopSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    ranking: rankingReducer,
    shop: shopReducer,
  },
});

export default store;
