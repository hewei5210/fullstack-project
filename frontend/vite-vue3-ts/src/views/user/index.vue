<template>
  <div class="container">
    <div class="user-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-button type="primary" @click="showAddUserDialog" style="margin-right: 20px;">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱"
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="roleFilter"
          placeholder="角色筛选"
          style="width: 150px; margin-left: 16px"
        >
          <el-option label="全部角色" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </div>

      <!-- 用户列表 -->
      <el-table
        :data="filteredUsers"
        stripe
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="role" label="角色" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
              {{ scope.row.role === "admin" ? "管理员" : "普通用户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template #default="scope">
            <el-button size="small" type="warning" @click="editUser(scope.row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteUser(scope.row)"
              :disabled="scope.row.username === 'admin'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalUsers"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form
        :model="userForm"
        :rules="userRules"
        ref="userFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";

// 响应式数据
const searchKeyword = ref("");
const roleFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);
const userDialogVisible = ref(false);
const isEdit = ref(false);

// 用户数据
const users = ref([
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  }
]);

// 表单数据
const userForm = ref({
  username: "",
  email: "",
  password: "",
  role: "user",
});

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 个字符", trigger: "blur" },
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
};

// 计算属性
const filteredUsers = computed(() => {
  let result = users.value;

  if (searchKeyword.value) {
    result = result.filter(
      (user) =>
        user.username.includes(searchKeyword.value) ||
        user.email.includes(searchKeyword.value)
    );
  }

  if (roleFilter.value) {
    result = result.filter((user) => user.role === roleFilter.value);
  }

  return result;
});

// 方法
const handleSearch = () => {
  currentPage.value = 1;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("zh-CN");
};

const showAddUserDialog = () => {
  isEdit.value = false;
  userForm.value = {
    username: "",
    email: "",
    password: "",
    role: "user",
  };
  userDialogVisible.value = true;
};

const editUser = (user: any) => {
  isEdit.value = true;
  userForm.value = {
    username: user.username,
    email: user.email,
    password: "",
    role: user.role,
  };
  userDialogVisible.value = true;
};

const deleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 这里应该调用 API 删除用户
    users.value = users.value.filter((u) => u.id !== user.id);
    ElMessage.success("用户删除成功");
  } catch {
    // 用户取消删除
  }
};

const submitUser = () => {
  // 这里应该调用 API 保存用户
  if (isEdit.value) {
    const index = users.value.findIndex(
      (u) => u.username === userForm.value.username
    );
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...userForm.value };
    }
    ElMessage.success("用户更新成功");
  } else {
    const newUser = {
      id: users.value.length + 1,
      ...userForm.value,
      createdAt: new Date(),
    };
    users.value.push(newUser);
    ElMessage.success("用户创建成功");
  }

  userDialogVisible.value = false;
};

// 生命周期
onMounted(() => {
  totalUsers.value = users.value.length;
});
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-content {
  min-height: 400px;
}
</style>
