import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import rankingReducer from './rankingSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    ranking: rankingReducer,
  },
});

export default store;
