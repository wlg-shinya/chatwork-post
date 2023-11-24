<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import { LocalStorage, DataSignIn } from "../local-storage";

const emit = defineEmits<{
  onUpdateApiToken: [token: string];
}>();

const localData = LocalStorage.fetch<DataSignIn>();

const displaySignInInfo = computed(() => (accountName.value ? `ようこそ ${accountName.value} さん` : ""));

const apiToken = ref(localData.apiToken);
const autoSignIn = ref(localData.autoSignIn);
const accountName = ref("");

function saveLocalStorage() {
  localData.apiToken = apiToken.value;
  localData.autoSignIn = autoSignIn.value;
  LocalStorage.save(localData);
}

function signin() {
  // サインイン開始時はアカウント名を無効化
  accountName.value = "";

  try {
    // APIトークンが未入力ならエラー
    if (apiToken.value == "") throw new Error();

    // APIトークンからアカウント名を取得するためサーバに問い合わせる
    axios
      .get("/api/chatwork_account", {
        params: {
          api_token: apiToken.value,
        },
      })
      .then((response: any) => {
        // アカウント名を取得
        const data = JSON.parse(JSON.stringify(response.data));
        accountName.value = data.name;

        // アカウント名が取得できたので有効なAPIトークンを通知
        emit("onUpdateApiToken", apiToken.value);

        // 有効なAPIトークン得られたのでローカルストレージに保存
        saveLocalStorage();
      })
      .catch((error) => {
        throw error;
      });
  } catch {
    // エラーが発生したらサインアウト
    signout();

    // TODO:通知
  }
}

function signout() {
  // 情報をクリアすることでサインアウントとする
  accountName.value = "";
  apiToken.value = "";
  // 無効化したAPIトークンを通知
  emit("onUpdateApiToken", apiToken.value);
  // ローカルストレージに保存されているAPIトークンを復元
  apiToken.value = localData.apiToken;
}

// ページ表示や更新のとき、自動サインイン有効ならサインインを試みて、そうでなければサインアウト
autoSignIn.value ? signin() : signout();
</script>

<template>
  <input id="api-token" v-model="apiToken" placeholder="ChatworkAPI トークン" />
  <button id="api-token" @click="signin()">サインイン</button>
  <input type="checkbox" v-model="autoSignIn" />次回は自動サインイン
  <br />
  <a href="https://developer.chatwork.com/docs">ChatworkAPI トークンとは</a>
  <br />
  <h1>
    <span>{{ displaySignInInfo }}</span>
  </h1>
</template>
