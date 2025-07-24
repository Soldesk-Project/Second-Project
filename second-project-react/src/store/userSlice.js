import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null,
  server: null,
};

// 1) 비동기 Thunk 생성
export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (userNo, thunkAPI) => {
    const res = await axios.get(`/user/${userNo}`);
    return res.data;  // payload 로 넘어갑니다
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      console.trace("🧨 setUser 호출됨 with payload:", action.payload);
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setServer: (state, action) => {
      state.server = action.payload;
      localStorage.setItem('server', action.payload);
    },
    clearUser: (state) => {
      state.user = null;
      state.server = null;
      localStorage.removeItem('user');
      localStorage.removeItem('server');
    },
    clearServer: (state) => {
      state.server = null;
      localStorage.removeItem('server');
    },
    loadUserFromStorage: (state) => {
      const storedUser = localStorage.getItem('user');
      const storedServer = localStorage.getItem('server');
      if (storedUser) state.user = JSON.parse(storedUser);
      if (storedServer) state.server = storedServer;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { setUser, setServer, clearUser, clearServer, loadUserFromStorage } = userSlice.actions;
export default userSlice.reducer;
