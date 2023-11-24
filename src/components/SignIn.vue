<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import { LocalStorage, DataSignIn } from "../local-storage";

const emit = defineEmits<{
  onUpdateApiToken: [token: string];
}>();

const localData = LocalStorage.fetch<DataSignIn>();

const displaySignInInfo = computed(() => (accountName.value ? `ようこそ ${accountName.value} さん` : ""));

const apiToken = ref("");
const accountName = ref("");

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

        // アカウント名が取得できたので入力されたAPIトークンを通知
        emit("onUpdateApiToken", apiToken.value);

        // 入力されたAPIトークンをローカルストレージに保存
        localData.apiToken = apiToken.value;
        LocalStorage.save(localData);
      })
      .catch((error) => {
        throw error;
      });
  } catch {
    // エラーが発生したらサインアウト
    signout();
  }
}

function signout() {
  // 情報をクリアすることでサインアウントとする
  accountName.value = "";
  apiToken.value = "";
  // 無効化したAPIトークンを通知
  emit("onUpdateApiToken", apiToken.value);
  // TODO：ユーザ選択対応
  // ローカルストレージに保存されているAPIトークンを復元
  apiToken.value = localData.apiToken;
}

// ページ表示や更新のときはサインアウト
signout();
</script>

<template>
  <input id="api-token" v-model="apiToken" placeholder="ChatworkAPI トークン" />
  <button id="api-token" @click="signin()">サインイン</button>
  <br />
  <a href="https://developer.chatwork.com/docs">ChatworkAPI トークンとは</a>
  <br />
  <span>{{ displaySignInInfo }}</span>
</template>
