<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "../services/http";
import { getDefaultRouteByRole, useSessionStore } from "../stores/session";
import type { AuthRole } from "../types/auth";

const router = useRouter();
const route = useRoute();
const session = useSessionStore();

const form = reactive({
  account: "",
  password: ""
});

const loading = ref(false);
const errorText = ref("");

const resolveRedirectPath = (role: AuthRole): string => {
  const rawRedirect = route.query.redirect;
  if (typeof rawRedirect === "string" && rawRedirect.startsWith("/")) {
    return rawRedirect;
  }

  return getDefaultRouteByRole(role);
};

const submit = async () => {
  if (!form.account.trim() || !form.password) {
    errorText.value = "请输入账号和密码";
    return;
  }

  loading.value = true;
  errorText.value = "";

  try {
    const user = await session.loginByAccount({
      account: form.account,
      password: form.password
    });

    if (!user) {
      errorText.value = "登录失败，请重试";
      return;
    }

    if (user.role === "student") {
      await session.logout();
      errorText.value = "学生账号请使用学生端登录";
      return;
    }

    await router.replace(resolveRedirectPath(user.role));
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "登录失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
    <section class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
      <h1 class="mt-2 text-2xl font-bold text-slate-900">统一登录</h1>
      <p class="mt-1 text-sm text-slate-500">管理员 / 教师使用同一入口</p>

      <form class="mt-5 space-y-3" @submit.prevent="submit">
        <label class="block text-sm text-slate-700" for="login-account">账号</label>
        <input
          id="login-account"
          v-model="form.account"
          name="account"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="请输入账号…"
          spellcheck="false"
          autocomplete="username"
        />
        <label class="block text-sm text-slate-700" for="login-password">密码</label>
        <input
          id="login-password"
          v-model="form.password"
          name="password"
          type="password"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="请输入密码…"
          spellcheck="false"
          autocomplete="current-password"
        />

        <button
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {{ loading ? "登录中…" : "登录" }}
        </button>
      </form>

      <p v-if="errorText" class="mt-3 text-sm text-rose-600" role="status" aria-live="polite">{{ errorText }}</p>
    </section>
  </main>
</template>
