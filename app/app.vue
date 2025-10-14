<template>
  <!-- 整个应用入口，统一使用布局组件包裹所有页面 -->
  <NuxtLayout>
    <!-- 全局加载指示器，提示路由或数据加载状态 -->
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <!-- 根据当前路由渲染对应的页面组件 -->
    <NuxtPage />
  </NuxtLayout>
</template>
