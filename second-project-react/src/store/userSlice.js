import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  server: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
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
    }
  },
});

export const { setUser, setServer, clearUser, clearServer, loadUserFromStorage } = userSlice.actions;
export default userSlice.reducer;
