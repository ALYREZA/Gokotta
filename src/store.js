import Vue from 'vue'
import Vuex from 'vuex'

import encode from './services/encode'
import Vibrant from 'node-vibrant'
import {
  getSongByID,
  switchSong,
  getSongImageAndMainColor
} from './services/songs'

Vue.use(Vuex)

const SET_PLAY_SONG = 'SET_PLAY_SONG'
const ADD_TO_CURRENT_LIST = 'ADD_TO_CURRENT_LIST'
const DELETE_FROM_CURRENT_LIST = 'DELETE_FROM_CURRENT_LIST'
const DELETE_ALL_FROM_CURRENT_LIST = 'DELETE_ALL_FROM_CURRENT_LIST'

const state = {
  playState: {
    lastSong: JSON.parse(localStorage.getItem("lastSong")) || {
      title: '',
      album: '',
      path: '',
      image: ''
    },
    duration: 0,
    currentTime: 0,
    isPlay: false,
    playAll: false,
    list: 'all',
    currentList: 'all',
    shuffle: false,
    color: localStorage.getItem("color") || ''
  },
  currentList: JSON.parse(localStorage.getItem("currentList")) || []
}

const actions = {
  addToCurrentList: ADD_TO_CURRENT_LIST,
  deleteFromCurrentList: (store, id) => {
    let index = store.state.currentList.indexOf(id);
    if (index !== -1) {
      //while the removing song is current song
      if (id === store.state.playState.lastSong.id) {
        if (store.state.currentList.length !== 1) {
          let prevID = switchSong('prev', false, store.state.currentList, store.state.playState.lastSong.id);
          store.dispatch('SET_PLAY_SONG', prevID);
        }
      }
      store.dispatch('DELETE_FROM_CURRENT_LIST', index);
    }
  },
  deleteAllFromCurrentList: DELETE_ALL_FROM_CURRENT_LIST,
  setPlaySongByID: SET_PLAY_SONG
}

const mutations = {
  SET_PLAY_SONG(state, id) {
    getSongByID(id).then((song) => {
      if (song.image) {
        let v = new Vibrant(song.image);
        v.getSwatches((error, swatches) => {
          let vibrant = swatches.Vibrant || swatches.DarkVibrant || swatches.DarkMuted || swatches.LightVibrant;
          let rgb = vibrant.rgb;
          for (let i = 0; i < 3; i++) {
            rgb[i] = Math.floor(rgb[i]);
          }
          let string = "rgba(" + rgb.join(",") + ",0.7)";
          state.playState.color = string;
          localStorage.setItem('color', string);
        });
        new Notification(song.title, {
          body: song.artist,
          icon: song.image,
          silent: true
        });
      }
      state.playState.currentTime = 0;
      state.playState.lastSong = song;
      wavesurfer.load(song.path);
      wavesurfer.on('ready', function() {
        wavesurfer.play();
        state.playState.isPlay = true;
        state.playState.duration = parseInt(wavesurfer.getDuration());
      });
      localStorage.setItem('lastSong', JSON.stringify(song));
    });
  },
  ADD_TO_CURRENT_LIST(state, id) {
    if (!state.currentList.includes(id)) {
      state.currentList.push(id);
      localStorage.setItem('currentList', JSON.stringify(state.currentList));
    }
  },
  DELETE_FROM_CURRENT_LIST(state, index) {
    state.currentList.splice(index, 1);
    localStorage.setItem('currentList', JSON.stringify(state.currentList));
  },
  DELETE_ALL_FROM_CURRENT_LIST(state) {
    state.currentList = [];
    state.playState.playAll = false;
    localStorage.setItem('currentList', '[]');
  }
}

export default new Vuex.Store({
  state,
  actions,
  mutations
})
