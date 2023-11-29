<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue";
import axios from "axios";
import { Toast } from "bootstrap";
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

// サインインフラグは変更時点でストレージ保存する
watch(
  () => inputData.value.isSavedApiToken,
  () => saveLocalStorageIsSavedApiToken()
);
watch(
  () => inputData.value.autoSignIn,
  () => saveLocalStorageAutoSignIn()
);

function saveLocalStorageApiToken() {
  const newData = LocalStorage.fetch();
  // APIトークン保存拒否時は無効なデータを保存
  newData.apiToken = newData.isSavedApiToken ? inputData.value.apiToken : "";
  LocalStorage.save(newData);
}

function saveLocalStorageIsSavedApiToken() {
  const newData = LocalStorage.fetch();
  newData.isSavedApiToken = inputData.value.isSavedApiToken;
  // APIトークン保存拒否の場合はAPIトークン自体も無効化
  if (!newData.isSavedApiToken) {
    newData.apiToken = "";
  }
  LocalStorage.save(newData);
}

function saveLocalStorageAutoSignIn() {
  const newData = LocalStorage.fetch();
  newData.autoSignIn = inputData.value.autoSignIn;
  LocalStorage.save(newData);
}

async function signin() {
  // サインイン開始時はアカウント名を無効化
  accountName.value = "";

  try {
    // APIトークンが未入力ならエラー
    if (inputData.value.apiToken == "") throw new Error();

    // APIトークンからアカウント名を取得するためサーバに問い合わせる
    await axios
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

        // 有効なAPIトークンを得られたのでローカルストレージに保存
        saveLocalStorageApiToken();
      })
      .catch((error) => {
        throw error;
      });
  } catch {
    // エラーが発生したらサインアウト
    signout();

    // 通知
    notifyError();
  }
}

function signout() {
  // 取得したアカウント名をクリアすることでサインアウントとする
  accountName.value = "";
  inputData.value = LocalStorage.fetch();
  // 無効なAPIトークンを通知
  emit("onUpdateApiToken", "");
}

function notifyError() {
  const element = document.getElementById("toastError");
  if (!element) return; // 要素が取得できなければ何もしない
  Toast.getOrCreateInstance(element).show();
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
      <div class="form-check form-switch">
        <input type="checkbox" v-model="inputData.isSavedApiToken" class="form-check-input" id="isSavedApiToken" />
        <label class="form-check-label" for="isSavedApiToken">ブラウザに保存する</label>
      </div>
      <div class="form-check form-switch">
        <input type="checkbox" v-model="inputData.autoSignIn" class="form-check-input" id="autoSignIn" />
        <label class="form-check-label" for="autoSignIn">次回から自動サインイン</label>
      </div>
    </div>
    <div v-if="displaySignInInfo">
      <hr />
      <h2 class="text-center">{{ displaySignInInfo }}</h2>
    </div>
  </div>
  <div class="position-fixed top-0 start-50 translate-middle-x">
    <div id="toastError" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <span class="me-auto fw-bold">エラー</span>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">入力された ChatworkAPI トークンではサインインできませんでした</div>
    </div>
  </div>
</template>
