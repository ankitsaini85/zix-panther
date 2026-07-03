import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api/axios.js';

const initialState = {
  user: null,
  token: localStorage.getItem('zix_panther_token') || null,
  status: 'idle',
  error: null
};

export const loginUser = createAsyncThunk('auth/loginUser', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/login', payload);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const loadMe = createAsyncThunk('auth/loadMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/auth/me');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('zix_panther_token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('zix_panther_token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.user = {
          userId: action.payload.userId,
          fullName: action.payload.fullName,
          role: action.payload.role,
          activeStatus: action.payload.activeStatus,
          referralCode: action.payload.referralCode || action.payload.userId
        };
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;