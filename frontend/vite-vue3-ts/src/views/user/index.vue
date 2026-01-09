<template>
  <div class="container">
    <div class="user-content">
      <!-- 操作按钮组 -->
      <div style="margin-bottom: 20px">
        <el-button type="primary" :icon="Plus" @click="showAddUserDialog">
          新增用户
        </el-button>
        <el-input
          v-model="searchKeyword"
          style="max-width: 350px; margin-left: 10px"
          :placeholder="placeholderMap[searchType]"
        >
          <template #prepend>
            <el-select
              v-model="searchType"
              style="width: 130px"
              popper-class="user-search-type-dropdown"
              :popper-append-to-body="true"
              :popper-placement="'bottom-start'"
            >
              <el-option label="用户名" value="username" />
              <el-option label="邮箱" value="email" />
              <el-option label="手机号" value="phone" />
            </el-select>
          </template>
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
        <el-select
          v-model="roleFilter"
          placeholder="角色筛选"
          style="width: 150px; margin-left: 10px"
          popper-class="user-role-filter-dropdown"
          :popper-append-to-body="true"
          :popper-placement="'bottom-start'"
        >
          <el-option label="全部角色" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </div>

      <!-- 用户列表 -->
      <el-table :data="users" stripe style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="scope">
            <span
              class="copyable-cell"
              @dblclick="copyToClipboard(scope.row.username, '用户名')"
              :title="'双击复制: ' + scope.row.username"
            >
              {{ scope.row.username }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="200">
          <template #default="scope">
            <span
              v-if="scope.row.email && !scope.row.email.startsWith('no-email-')"
              class="copyable-cell"
              @dblclick="copyToClipboard(scope.row.email, '邮箱')"
              :title="'双击复制: ' + scope.row.email"
            >
              {{ scope.row.email }}
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="150">
          <template #default="scope">
            <span
              v-if="scope.row.phone && !scope.row.phone.startsWith('no-phone-')"
              class="copyable-cell"
              @dblclick="copyToClipboard(scope.row.phone, '手机号')"
              :title="'双击复制: ' + scope.row.phone"
            >
              {{ scope.row.phone }}
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px">
              <el-button
                size="small"
                type="warning"
                @click="editUser(scope.row)"
                :disabled="!canEdit(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteUser(scope.row)"
                :disabled="!canDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
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
        style="float: right; margin: 15px 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      :z-index="2000"
      :append-to-body="true"
      @close="handleCloseDialog"
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
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="userForm.role"
            style="width: 100%"
            popper-class="user-role-select-dropdown"
            :popper-append-to-body="true"
            :popper-placement="'bottom-start'"
            :disabled="isEdit && currentUser?.role === 'user' && currentUser?.username === userForm.username"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="submitUser">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="25%"
      :close-on-click-modal="false"
    >
      <span>确定要删除用户 {{ userToDelete?.username }} 吗？</span>
      <template #footer>
        <el-button @click="cancelDelete">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { http } from "@/net/http";
import tokenManager from "@/utils/tokenManager";

// 获取当前登录用户信息
const currentUser = computed(() => {
  return tokenManager.getUser();
});

// 响应式数据
const searchKeyword = ref("");
const searchType = ref("username");
const roleFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);
const userDialogVisible = ref(false);
const isEdit = ref(false);
const userFormRef = ref();
const deleteDialogVisible = ref(false);
const userToDelete = ref<any>(null);
const deleteLoading = ref(false);

// 搜索占位符映射
const placeholderMap: Record<string, string> = {
  username: "搜索用户名",
  email: "搜索邮箱",
  phone: "搜索手机号",
};

// 用户数据
const users = ref([
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    phone: "",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  },
]);

// 表单数据
const userForm = ref({
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "user",
});

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 个字符", trigger: "blur" },
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
};

// 方法
const handleSearch = () => {
  currentPage.value = 1;
  fetchUsers();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchUsers();
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchUsers();
};

const formatDate = (date: Date | string) => {
  if (!date) return "--";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("zh-CN");
};

// 权限判断：是否可以编辑用户
const canEdit = (user: any): boolean => {
  if (!currentUser.value) return false;
  
  const currentUserRole = currentUser.value.role;
  const currentUsername = currentUser.value.username;
  
  // 管理员可以编辑所有用户
  if (currentUserRole === "admin") {
    return true;
  }
  
  // 普通用户只能编辑自己
  if (currentUserRole === "user") {
    return user.username === currentUsername;
  }
  
  return false;
};

// 权限判断：是否可以删除用户
const canDelete = (user: any): boolean => {
  if (!currentUser.value) return false;
  
  const currentUserRole = currentUser.value.role;
  
  // 不能删除 admin 用户（无论什么角色）
  if (user.username === "admin") {
    return false;
  }
  
  // 管理员可以删除普通用户
  if (currentUserRole === "admin") {
    return true;
  }
  
  // 普通用户不能删除任何人（包括自己）
  return false;
};

// 复制到剪贴板
const copyToClipboard = async (text: string, label: string) => {
  if (!text || text === "--") return;
  
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${label}已复制: ${text}`);
  } catch (error) {
    // 降级方案：使用传统方法
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        ElMessage.success(`${label}已复制: ${text}`);
      } else {
        ElMessage.error("复制失败，请手动复制");
      }
    } catch (fallbackError) {
      ElMessage.error("复制失败，请手动复制");
    }
  }
};

const showAddUserDialog = () => {
  isEdit.value = false;
  userForm.value = {
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  };
  userDialogVisible.value = true;
};

const editUser = (user: any) => {
  // 权限检查
  if (!canEdit(user)) {
    ElMessage.warning("您没有权限编辑该用户");
    return;
  }
  
  isEdit.value = true;
  userForm.value = {
    username: user.username,
    email: user.email && !user.email.startsWith("no-email-") ? user.email : "",
    phone: user.phone && !user.phone.startsWith("no-phone-") ? user.phone : "",
    password: "",
    role: user.role,
  };
  userDialogVisible.value = true;
};

const handleDeleteUser = (user: any) => {
  // 确保用户对象有效
  if (!user || !user.username) {
    ElMessage.error("用户信息无效");
    return;
  }

  // 权限检查
  if (!canDelete(user)) {
    ElMessage.warning("您没有权限删除该用户");
    return;
  }

  userToDelete.value = user;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  if (!userToDelete.value) {
    ElMessage.error("用户信息无效");
    return;
  }

  try {
    deleteLoading.value = true;
    await removeUser(userToDelete.value.username);
    deleteDialogVisible.value = false;
    userToDelete.value = null;
  } catch (error: any) {
    // 用户取消删除或删除失败
    if (error && error.response) {
      // API 错误已在 removeUser 中处理
    }
  } finally {
    deleteLoading.value = false;
  }
};

const cancelDelete = () => {
  deleteDialogVisible.value = false;
  userToDelete.value = null;
};

const handleCloseDialog = () => {
  userFormRef.value?.resetFields();
  userDialogVisible.value = false;
};

const submitUser = async () => {
  try {
    await userFormRef.value?.validate();

    if (isEdit.value) {
      await updateUser(userForm.value);
    } else {
      await createUser(userForm.value);
    }
    userDialogVisible.value = false;
  } catch (error: any) {
    if (error && error.response) {
      // 处理 API 错误
      const errorMessage = error.response?.data?.message || (isEdit.value ? "更新用户失败" : "创建用户失败");
      ElMessage.error(errorMessage);
    }
    // 表单验证错误不需要额外处理
  }
};

// 获取用户列表
const fetchUsers = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    // 添加搜索参数
    if (searchKeyword.value && searchType.value) {
      params.searchType = searchType.value;
      params.searchKeyword = searchKeyword.value;
    }

    // 添加角色筛选参数
    if (roleFilter.value) {
      params.roleFilter = roleFilter.value;
    }

    const response = await http.get("/api/users", params);
    console.log(response);
    if (response.data.status === 200) {
      const responseData = response.data.data || {};
      users.value = responseData.users || [];
      totalUsers.value = responseData.pagination?.total || 0;
    } else {
      ElMessage.error(response.data.message || "获取用户列表失败");
    }
  } catch (error: any) {
    ElMessage.error("获取用户列表失败");
  }
};

// 创建用户
const createUser = async (userData: any) => {
  // 处理空字符串，转换为空字符串（后端会处理占位符）
  const processedData = {
    ...userData,
    email: userData.email || "",
    phone: userData.phone || "",
  };

  const response = await http.post("/api/users", processedData);
  ElMessage.success("用户创建成功");
  await fetchUsers(); // 重新获取用户列表
  return response;
};

// 更新用户
const updateUser = async (userData: any) => {
  // 处理空字符串，转换为空字符串（后端会处理占位符）
  const processedData = {
    ...userData,
    email: userData.email || "",
    phone: userData.phone || "",
  };

  const response = await http.put(`/api/users/${userData.username}`, processedData);
  ElMessage.success("用户更新成功");
  await fetchUsers(); // 重新获取用户列表
  return response;
};

// 删除用户
const removeUser = async (username: string) => {
  try {
    await http.delete(`/api/users/${username}`);
    ElMessage.success("用户删除成功");

    await fetchUsers(); // 重新获取用户列表
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "删除用户失败";
    ElMessage.error(errorMessage);
    throw error;
  }
};

// 监听角色筛选变化
watch(roleFilter, () => {
  currentPage.value = 1;
  fetchUsers();
});

// 生命周期
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.user-content {
  min-height: 400px;
}

.copyable-cell {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  display: inline-block;
  padding: 2px 4px;
  border-radius: 2px;
}

.copyable-cell:hover {
  background-color: #f0f9ff;
  color: #409eff;
}
</style>

<style>
/* 全局样式，修复用户角色选择下拉框的显示问题 */
.user-role-select-dropdown,
.user-role-filter-dropdown,
.user-search-type-dropdown {
  z-index: 3000 !important;
  max-height: none !important;
  min-width: 120px !important;
  width: auto !important;
}

.user-role-select-dropdown .el-select-dropdown__wrap,
.user-role-filter-dropdown .el-select-dropdown__wrap,
.user-search-type-dropdown .el-select-dropdown__wrap {
  max-height: none !important;
}

.user-role-select-dropdown .el-select-dropdown__list,
.user-role-filter-dropdown .el-select-dropdown__list,
.user-search-type-dropdown .el-select-dropdown__list {
  max-height: none !important;
}

.user-role-select-dropdown .el-select-dropdown__item,
.user-role-filter-dropdown .el-select-dropdown__item,
.user-search-type-dropdown .el-select-dropdown__item {
  padding: 0 20px;
  height: 34px;
  line-height: 34px;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  min-width: 100px;
}

.user-role-select-dropdown .el-select-dropdown__item:hover,
.user-role-filter-dropdown .el-select-dropdown__item:hover,
.user-search-type-dropdown .el-select-dropdown__item:hover {
  background-color: #f5f7fa;
}

.user-role-select-dropdown .el-select-dropdown__item.selected,
.user-role-filter-dropdown .el-select-dropdown__item.selected,
.user-search-type-dropdown .el-select-dropdown__item.selected {
  color: #409eff;
  font-weight: bold;
}
</style>
