<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import { LocalStorage, DataSignIn, DataSignInDefault } from "../local-storage";

const emit = defineEmits<{
  onUpdateApiToken: [token: string];
}>();

const displaySignInInfo = computed(() => (accountName.value ? `ようこそ ${accountName.value} さん` : ""));

const inputData = ref(LocalStorage.fetch<DataSignIn>());
const accountName = ref("");

function saveLocalStorage() {
  // セーブ許可してたら入力情報を丸ごと、そうでなければデフォルトをローカルストレージに保存
  LocalStorage.save(inputData.value.isSavedApiToken ? inputData.value : DataSignInDefault);
}

function signin() {
  // サインイン開始時はアカウント名を無効化
  accountName.value = "";

  try {
    // APIトークンが未入力ならエラー
    if (inputData.value.apiToken == "") throw new Error();

    // APIトークンからアカウント名を取得するためサーバに問い合わせる
    axios
      .get("/api/chatwork_account", {
        params: {
          api_token: inputData.value.apiToken,
        },
      })
      .then((response: any) => {
        // アカウント名を取得
        const data = JSON.parse(JSON.stringify(response.data));
        accountName.value = data.name;

        // アカウント名が取得できたので有効なAPIトークンを通知
        emit("onUpdateApiToken", inputData.value.apiToken);

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
  // 無効なAPIトークンを通知
  emit("onUpdateApiToken", "");
  // 入力情報はセーブ許可してたらローカルストレージに保存されているデータで復元。そうでなければデフォルトでリセット
  inputData.value = inputData.value.isSavedApiToken ? LocalStorage.fetch<DataSignIn>() : DataSignInDefault;
}

// ページ表示や更新のとき、自動サインイン有効ならサインインを試みる。そうでなければサインアウト
inputData.value.autoSignIn ? signin() : signout();
</script>

<template>
  <input id="api-token" v-model="inputData.apiToken" placeholder="ChatworkAPI トークン" />
  <button id="api-token" @click="signin()">サインイン</button><br />
  <input type="checkbox" v-model="inputData.isSavedApiToken" />ブラウザに保存する<br />
  <input type="checkbox" v-model="inputData.autoSignIn" />次回から自動サインイン
  <br />
  <a href="https://developer.chatwork.com/docs">ChatworkAPI トークンとは</a>
  <br />
  <h2>
    <span>{{ displaySignInInfo }}</span>
  </h2>
</template>
