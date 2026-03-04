<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resolvePostLoginRedirect, type AuthRole } from "../router/auth-guard";
import { useSessionStore } from "../stores/session";

const router = useRouter();
const route = useRoute();
const session = useSessionStore();

const form = reactive({
  role: "teacher" as AuthRole,
  teacherId: session.state.teacherId,
  adminKey: session.state.adminKey
});
const errorText = ref("");

const getRedirectQuery = () => {
  const redirect = route.query.redirect;
  if (typeof redirect === "string") return redirect;
  if (Array.isArray(redirect) && typeof redirect[0] === "string") return redirect[0];
  return undefined;
};

const loginAsTeacher = async () => {
  if (!form.teacherId.trim()) {
    errorText.value = "请输入教师ID";
    return;
  }

  session.setTeacherId(form.teacherId);
  session.clearAdminKey();
  const redirectPath = resolvePostLoginRedirect("teacher", getRedirectQuery());
  await router.replace(redirectPath);
};

const loginAsAdmin = async () => {
  if (!form.adminKey.trim()) {
    errorText.value = "请输入管理员 Key";
    return;
  }

  session.setAdminKey(form.adminKey);
  session.clearTeacherId();
  const redirectPath = resolvePostLoginRedirect("admin", getRedirectQuery());
  await router.replace(redirectPath);
};

const handleSubmit = async () => {
  errorText.value = "";
  if (form.role === "teacher") {
    await loginAsTeacher();
    return;
  }

  await loginAsAdmin();
};
</script>

<template>
  <section class="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
    <h1 class="mt-2 text-2xl font-bold text-slate-900">登录</h1>
    <p class="mt-2 text-sm text-slate-600">请选择身份并输入凭证，登录后才能访问对应业务页面。</p>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <button
        class="rounded-lg border px-3 py-2 text-sm"
        :class="form.role === 'teacher' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600'"
        @click="form.role = 'teacher'"
      >
        教师端登录
      </button>
      <button
        class="rounded-lg border px-3 py-2 text-sm"
        :class="form.role === 'admin' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600'"
        @click="form.role = 'admin'"
      >
        管理端登录
      </button>
    </div>

    <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
      <input
        v-if="form.role === 'teacher'"
        v-model="form.teacherId"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="输入教师ID（如 T-1）"
      />
      <input
        v-else
        v-model="form.adminKey"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="输入管理员 Key"
      />

      <button type="submit" class="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">登录</button>
    </form>

    <p v-if="errorText" class="mt-3 text-sm text-rose-600">{{ errorText }}</p>
  </section>
</template>
