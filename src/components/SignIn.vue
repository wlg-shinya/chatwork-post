<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import axios from "axios";
import { SignIn as LocalStorage } from "../local-storage";

const emit = defineEmits<{
  onUpdateApiToken: [token: string];
}>();

const displaySignInInfo = computed(() => (accountName.value ? `ようこそ ${accountName.value} さん` : ""));

const inputData = ref(LocalStorage.fetch());
const accountName = ref("");

// 自動サインインはセーブ拒否されたらできないので自動で無効化
watchEffect(() => {
  if (!inputData.value.isSavedApiToken) {
    inputData.value.autoSignIn = false;
  }
});
// セーブ許可は自動サインインを有効にしたら合わせて有効にする必要があるので自動で有効化
watchEffect(() => {
  if (inputData.value.autoSignIn) {
    inputData.value.isSavedApiToken = true;
  }
});

function saveLocalStorage() {
  // セーブ許可してたら入力情報を丸ごと、そうでなければデフォルトをローカルストレージに保存
  LocalStorage.save(inputData.value.isSavedApiToken ? inputData.value : LocalStorage.defaultData);
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
  inputData.value = inputData.value.isSavedApiToken ? LocalStorage.fetch() : LocalStorage.defaultData;
}

// ページ表示や更新のとき、自動サインイン有効ならサインインを試みる。そうでなければサインアウト
inputData.value.autoSignIn ? signin() : signout();
</script>

<template>
  <div class="d-flex flex-column">
    <div class="d-flex flex-column align-items-center">
      <label for="api-token" class="form-label">投稿したいアカウントの ChatworkAPI トークンを入力してください</label>
      <input id="api-token" v-model="inputData.apiToken" class="form-control" style="width: 350px" aria-describedby="chatworkapi-help" />
      <div id="chatworkapi-help" class="form-text">
        <a href="https://developer.chatwork.com/docs" class="link-primary">ChatworkAPI トークンとは</a>
      </div>
      <button id="api-token" @click="signin()" class="btn btn-primary btn-lg">サインイン</button>
    </div>
    <div class="align-self-center">
      <div class="form-switch">
        <input type="checkbox" v-model="inputData.isSavedApiToken" class="form-check-input" id="isSavedApiToken" />
        <label class="form-label" for="isSavedApiToken">ブラウザに保存する</label>
      </div>
      <div class="form-switch">
        <input type="checkbox" v-model="inputData.autoSignIn" class="form-check-input" id="autoSignIn" />
        <label class="form-label" for="autoSignIn">次回から自動サインイン</label>
      </div>
    </div>
    <div class="align-self-center">
      <h2>{{ displaySignInInfo }}</h2>
    </div>
  </div>
</template>
