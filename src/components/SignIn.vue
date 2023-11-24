<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";

const emit = defineEmits<{
  onUpdateApiToken: [token: string];
}>();

const apiToken = ref(""); // TODO:ローカルストレージ保存対応
const accountName = ref("");

const displayAccountName = computed(() => (accountName.value ? `ようこそ ${accountName.value} さん` : ""));

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
        const data = JSON.parse(JSON.stringify(response.data));
        accountName.value = data.name;

        // アカウント名が取得できた時はAPIトークン更新を通知する
        emit("onUpdateApiToken", apiToken.value);
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
  // APIトークンが無効になったことを通知する
  emit("onUpdateApiToken", apiToken.value);
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
  <span>{{ displayAccountName }}</span>
</template>
