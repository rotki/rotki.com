<template>
  <PageContainer>
    <template #title>Password Change</template>
    <UserActionMessage>
      <template #header>Password changed.</template>
      <div>
        Your password has been changed. Go to your
        <ButtonLink to="/home" inline color="primary">account</ButtonLink>.
      </div>
    </UserActionMessage>
  </PageContainer>
</template>
