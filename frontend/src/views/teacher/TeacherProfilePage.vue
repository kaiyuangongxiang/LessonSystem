<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER CENTER</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="profile" />
    </aside>

    <section class="teacher-dashboard-main teacher-profile-main">
      <header class="teacher-profile-head">
        <div>
          <div class="teacher-profile-head__eyebrow">PROFILE SETTINGS</div>
          <h2>个人资料</h2>
          <p>基础信息不再常驻占用页面区域，统一通过“编辑资料”弹窗进行维护，保存后会同步当前登录资料。</p>
        </div>

        <div class="teacher-profile-head__actions">
          <button type="button" class="auth-btn" :disabled="loading" @click="openEditorDialog">编辑资料</button>
        </div>
      </header>

      <p v-if="errorMessage && !showEditorDialog" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success teacher-profile-feedback">{{ successMessage }}</p>

      <article class="teacher-profile-panel teacher-profile-panel--preview">
        <div class="teacher-profile-panel__head teacher-profile-panel__head--preview">
          <div>
            <div class="teacher-profile-panel__eyebrow">BASIC INFO</div>
            <h3>基础信息</h3>
          </div>
          <div class="teacher-profile-head__actions">
            <span class="teacher-profile-panel__status">{{ selectedCollegeName }}</span>
            <button type="button" class="course-chip" :disabled="loading" @click="openEditorDialog">编辑资料</button>
          </div>
        </div>

        <div class="teacher-profile-summary teacher-profile-summary--wide">
          <div class="teacher-profile-summary__item">
            <span>当前用户名</span>
            <strong>{{ form.username || '未填写' }}</strong>
          </div>
          <div class="teacher-profile-summary__item">
            <span>教师姓名</span>
            <strong>{{ form.teacherName || '未填写' }}</strong>
          </div>
          <div class="teacher-profile-summary__item">
            <span>性别</span>
            <strong>{{ form.gender || '未填写' }}</strong>
          </div>
          <div class="teacher-profile-summary__item">
            <span>联系邮箱</span>
            <strong>{{ form.email || '未填写' }}</strong>
          </div>
          <div class="teacher-profile-summary__item">
            <span>所属学院</span>
            <strong>{{ selectedCollegeName }}</strong>
          </div>
          <div class="teacher-profile-summary__item">
            <span>资料状态</span>
            <strong>{{ profileStatusText }}</strong>
          </div>
          <div class="teacher-profile-summary__item teacher-profile-summary__item--full">
            <span>个人简介</span>
            <strong>{{ form.profile || '暂未填写个人简介' }}</strong>
          </div>
        </div>

        <div class="teacher-profile-note teacher-profile-note--full">
          <strong>当前模式</strong>
          <p>资料编辑已收敛到独立弹窗，不会再挤占教师中心其它页面的位置；需要修改时直接点击“编辑资料”即可。</p>
        </div>
      </article>

      <TeacherWorkspaceDialog
        v-model="showEditorDialog"
        eyebrow="PROFILE EDITOR"
        title="编辑资料"
        description="在弹窗中维护教师基础信息，保存后将自动同步当前登录资料。"
        :disabled="saving"
        @close="closeEditorDialog"
      >
        <p v-if="errorMessage" class="course-feedback teacher-workspace-dialog__feedback">{{ errorMessage }}</p>

        <form class="teacher-profile-form" @submit.prevent="submitProfile">
          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field">
              <span>用户名</span>
              <input v-model.trim="form.username" type="text" maxlength="50" placeholder="请输入用户名" />
            </label>

            <label class="teacher-profile-field">
              <span>教师姓名</span>
              <input v-model.trim="form.teacherName" type="text" maxlength="50" placeholder="请输入教师姓名" />
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field">
              <span>性别</span>
              <select v-model="form.gender">
                <option value="">请选择性别</option>
                <option v-for="item in genderOptions" :key="item" :value="item">
                  {{ item }}
                </option>
              </select>
            </label>

            <label class="teacher-profile-field">
              <span>所属学院</span>
              <select v-model="form.collegeId">
                <option value="">请选择所属学院</option>
                <option v-for="college in collegeOptions" :key="college.id" :value="String(college.id)">
                  {{ college.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field teacher-profile-field--full">
              <span>邮箱</span>
              <input v-model.trim="form.email" type="email" maxlength="100" placeholder="请输入邮箱，可为空" />
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field teacher-profile-field--full">
              <span>个人简介</span>
              <textarea v-model.trim="form.profile" rows="7" maxlength="2000" placeholder="请输入个人简介，可为空"></textarea>
            </label>
          </div>

          <div class="teacher-profile-editor__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading || saving" @click="loadProfile">重新加载</button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="closeEditorDialog">关闭</button>
            <button type="submit" class="auth-btn" :disabled="loading || saving">
              {{ saving ? '保存中...' : '保存资料' }}
            </button>
          </div>
        </form>
      </TeacherWorkspaceDialog>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import TeacherWorkspaceDialog from '@/components/TeacherWorkspaceDialog.vue'
import { getTeacherProfile, updateTeacherProfile, type TeacherCourseOption } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const showEditorDialog = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const collegeOptions = ref<TeacherCourseOption[]>([])
const genderOptions = ref<string[]>([])

const form = reactive({
  username: '',
  teacherName: '',
  gender: '',
  email: '',
  collegeId: '',
  profile: '',
})

const selectedCollegeName = computed(() => {
  const college = collegeOptions.value.find((item) => String(item.id) === form.collegeId)
  return college?.name || '未选择学院'
})

const profileStatusText = computed(() => {
  const fields = [form.username, form.teacherName, form.gender, form.collegeId, form.email, form.profile]
  const completed = fields.filter((item) => String(item || '').trim()).length
  return completed >= 6 ? '资料完整' : completed >= 4 ? '资料待完善' : '资料较少'
})

function fillForm(profile: {
  username?: string
  teacherName?: string
  gender?: string
  email?: string
  collegeId?: number | null
  profile?: string
}) {
  form.username = profile.username || ''
  form.teacherName = profile.teacherName || ''
  form.gender = profile.gender || ''
  form.email = profile.email || ''
  form.collegeId = profile.collegeId ? String(profile.collegeId) : ''
  form.profile = profile.profile || ''
}

function openEditorDialog() {
  errorMessage.value = ''
  showEditorDialog.value = true
}

function closeEditorDialog() {
  if (saving.value) {
    return
  }

  showEditorDialog.value = false
  errorMessage.value = ''
}

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await getTeacherProfile()
    collegeOptions.value = result.options.colleges
    genderOptions.value = result.options.genders
    fillForm(result.profile)
  } catch (error: any) {
    collegeOptions.value = []
    genderOptions.value = ['男', '女', '未知']
    errorMessage.value = error?.response?.data?.message || '教师资料加载失败'
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.username || !form.teacherName || !form.gender || !form.collegeId) {
    errorMessage.value = '请完整填写必填信息'
    return
  }

  saving.value = true

  try {
    const result = await updateTeacherProfile({
      username: form.username,
      teacherName: form.teacherName,
      gender: form.gender,
      email: form.email,
      collegeId: form.collegeId,
      profile: form.profile,
    })

    fillForm(result)
    authStore.updateProfile({
      id: result.id,
      username: result.username,
      name: result.teacherName,
    })
    showEditorDialog.value = false
    successMessage.value = '个人资料已更新'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '个人资料保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
