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
      <el-table
        :data="filteredUsers"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200">
          <template #default="scope">
            {{ scope.row.email || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="150">
          <template #default="scope">
            {{ scope.row.phone || '--' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { http } from "@/net/http";

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

// 搜索占位符映射
const placeholderMap: Record<string, string> = {
  username: "搜索用户名",
  email: "搜索邮箱",
  phone: "搜索手机号"
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
  }
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
  email: [
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" },
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
    result = result.filter((user) => {
      const keyword = searchKeyword.value.toLowerCase();
      switch (searchType.value) {
        case 'username':
          return user.username.toLowerCase().includes(keyword);
        case 'email':
          return user.email && user.email.toLowerCase().includes(keyword);
        case 'phone':
          return user.phone && user.phone.includes(keyword);
        default:
          return user.username.toLowerCase().includes(keyword) ||
                 (user.email && user.email.toLowerCase().includes(keyword)) ||
                 (user.phone && user.phone.includes(keyword));
      }
    });
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

const formatDate = (date: Date | string) => {
  if (!date) return '--';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString("zh-CN");
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
  isEdit.value = true;
  userForm.value = {
    username: user.username,
    email: user.email,
    phone: user.phone || "",
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

    await removeUser(user.username);
  } catch (error: any) {
    // 用户取消删除或删除失败
    if (error && error.response) {
      // API 错误已在 removeUser 中处理
    }
  }
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
      // API 错误已在 createUser/updateUser 中处理
      console.error('提交用户数据失败:', error);
    }
    // 表单验证错误不需要额外处理
  }
};

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await http.get('/api/users');
    users.value = response.data.data || [];
    totalUsers.value = users.value.length;
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  }
};

// 创建用户
const createUser = async (userData: any) => {
  try {
    await http.post('/api/users', userData);
    ElMessage.success('用户创建成功');
    await fetchUsers(); // 重新获取用户列表
  } catch (error: any) {
    console.error('创建用户失败:', error);
    const errorMessage = error.response?.data?.message || '创建用户失败';
    ElMessage.error(errorMessage);
    throw error;
  }
};

// 更新用户
const updateUser = async (userData: any) => {
  try {
    await http.put(`/api/users/${userData.username}`, userData);
    ElMessage.success('用户更新成功');
    await fetchUsers(); // 重新获取用户列表
  } catch (error: any) {
    console.error('更新用户失败:', error);
    const errorMessage = error.response?.data?.message || '更新用户失败';
    ElMessage.error(errorMessage);
    throw error;
  }
};

// 删除用户
const removeUser = async (username: string) => {
  try {
    await http.delete(`/api/users/${username}`);
    ElMessage.success('用户删除成功');
    await fetchUsers(); // 重新获取用户列表
  } catch (error: any) {
    console.error('删除用户失败:', error);
    const errorMessage = error.response?.data?.message || '删除用户失败';
    ElMessage.error(errorMessage);
    throw error;
  }
};

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
