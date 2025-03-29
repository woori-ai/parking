# Employees Password 사용 분석

이 문서는 ParkingManagement 프로젝트에서 `employees` 테이블의 `password` 필드가 어떻게 사용되고 있는지 분석한 내용입니다.

## 1. 데이터베이스 스키마

### 1.1 Employees 테이블 스키마

```typescript
// shared/schema.ts
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  carNumber: text("car_number").notNull(),
  position: text("position").notNull(),
  isAdmin: boolean("is_admin").default(false),
});
```

### 1.2 MongoDB 모델 스키마

```typescript
// server/models/mongoose.ts
const EmployeeSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  carNumber: { type: String, required: true },
  position: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});
```

## 2. 비밀번호 처리 흐름

### 2.1 사용자 생성 시 비밀번호 해싱

```typescript
// server/storage/PostgresStorage.ts - createEmployee 메서드
async createEmployee(employee: InsertEmployee): Promise<EmployeeType> {
  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(employee.password, 10);
  
  // 해싱된 비밀번호로 대체하여 저장
  const newEmployee = await Employee.create({
    ...employee,
    password: hashedPassword
  });
  
  return newEmployee.toJSON() as EmployeeType;
}
```

### 2.2 사용자 업데이트 시 비밀번호 해싱

```typescript
// server/storage/PostgresStorage.ts - updateEmployee 메서드
async updateEmployee(id: number, employee: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
  // 비밀번호가 제공된 경우에만 해싱
  if (employee.password) {
    employee.password = await bcrypt.hash(employee.password, 10);
  }
  
  // 나머지 업데이트 로직...
}
```

## 3. 인증 시스템

### 3.1 비밀번호 검증 (로그인)

```typescript
// server/storage/PostgresStorage.ts - validateCredentials 메서드
async validateCredentials(username: string, password: string): Promise<{ user: EmployeeType | AdminType | ManagerWorkType | undefined, role: "employee" | "admin" | "superadmin" | "manager" | undefined }> {
  try {
    // 직원 확인
    const employee = await Employee.findOne({ where: { username } });
    if (employee) {
      try {
        // bcrypt로 비밀번호 비교
        const isValid = await bcrypt.compare(password, employee.password);
        if (isValid) {
          const role = employee.isAdmin ? "admin" : "employee";
          return { user: employee.toJSON() as EmployeeType, role };
        }
      } catch (bcryptError) {
        console.error('Employee bcrypt.compare error:', bcryptError);
      }
    }
    
    // 다른 타입의 사용자 확인 로직...
    
    return { user: undefined, role: undefined };
  } catch (error) {
    console.error('validateCredentials error:', error);
    return { user: undefined, role: undefined };
  }
}
```

### 3.2 로그인 API 엔드포인트

```typescript
// server/routes.ts
app.post("/api/login", async (req, res) => {
  try {
    // 요청 데이터 파싱
    const { username, password } = req.body;
    
    console.log('로그인 시도:', username);
    
    // 관리자 계정 하드코딩 (단순화)
    if (username === 'admin' && password === '1234') {
      // 세션 설정 및 응답...
    }
    
    // 실제 사용자 검증은 validateCredentials 메서드를 통해 이루어져야 함
    // 아래 코드가 누락되어 있음
    
    // 인증 실패
    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error('로그인 오류:', err);
    return res.status(500).json({ message: "Server error" });
  }
});
```

## 4. 클라이언트 측 비밀번호 처리

### 4.1 로그인 폼

```typescript
// client/src/components/auth/LoginForm.tsx
const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login, loading, error } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<Login>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: Login) => {
    const success = await login(data.username, data.password);
    if (success && onSuccess) {
      onSuccess();
    }
  };
  
  // 폼 렌더링 로직...
}
```

### 4.2 인증 컨텍스트

```typescript
// client/src/contexts/AuthContext.tsx
const login = async (username: string, password: string): Promise<boolean> => {
  setLoading(true);
  setError(null);
  
  try {
    const res = await apiRequest("POST", "/api/login", { username, password });
    
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      return true;
    } else {
      setError("로그인에 실패했습니다. 사용자 이름 또는 비밀번호를 확인하세요.");
      return false;
    }
  } catch (err) {
    setError("서버 연결에 실패했습니다. 나중에 다시 시도해주세요.");
    return false;
  } finally {
    setLoading(false);
  }
};
```

### 4.3 직원 프로필 업데이트 (비밀번호 변경)

```typescript
// client/src/pages/ProfilePage.tsx
const formSchema = z.object({
  // 기타 필드...
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && !data.confirmPassword) return false;
  if (!data.password && data.confirmPassword) return false;
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

// 컴포넌트 내부 로직
const onSubmit = async (data: FormValues) => {
  setIsSubmitting(true);
  
  try {
    // Create update payload (omit confirmPassword and only include password if provided)
    const updateData: Partial<Employee> = {
      email: data.email,
      phone: data.phone,
      position: data.position,
    };
    
    // 비밀번호가 제공된 경우에만 포함
    if (data.password) {
      updateData.password = data.password;
    }
    
    // 나머지 업데이트 로직...
  } catch (error) {
    // 에러 처리...
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4.4 직원 생성 폼

```typescript
// client/src/components/employee/EmployeeForm.tsx
// 생성 모드 스키마 (비밀번호 필수)
const createFormSchema = z.object({
  username: z.string().min(3, "사용자 이름은 최소 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  email: z.string().email("유효한 이메일 주소를 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  carNumber: z.string().min(1, "차량 번호를 입력하세요"),
  position: z.string().min(1, "직급을 입력하세요"),
  isAdmin: z.boolean().default(false),
});

// 수정 모드 스키마 (비밀번호 선택)
const editFormSchema = z.object({
  username: z.string().min(3, "사용자 이름은 최소 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").optional().or(z.literal("")),
  // 다른 필드...
});

// 폼 제출 처리
const onSubmit = async (data: FormValues) => {
  try {
    let updatedData = { ...data };
    
    // 수정 모드이고 비밀번호가 비어 있는 경우, 비밀번호 필드 제거
    if (isEditMode) {
      // If password is empty in edit mode, remove it from the data
      let updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updatedData = updateData;
    }
    
    // 나머지 제출 로직...
  } catch (error) {
    // 에러 처리...
  }
};
```

## 5. 보안 이슈 및 개선 사항

### 5.1 식별된 문제점

1. **하드코딩된 관리자 비밀번호**: `/api/login` 엔드포인트에서 관리자 계정의 비밀번호가 하드코딩되어 있음 (`admin/1234`)
2. **로그인 API의 불완전한 구현**: routes.ts의 로그인 API에서 validateCredentials 메서드를 호출하는 코드가 누락됨
3. **비밀번호 복잡성 검증 부족**: 비밀번호 정책이 단순히 6자 이상만 요구하고, 복잡성(대소문자, 숫자, 특수문자 등)을 확인하지 않음
4. **로그에 비밀번호 노출**: 로그인 시도 시 비밀번호가 로그에 기록됨 (`console.log('로그인 시도:', username, password)`)

### 5.2 권장 개선 사항

1. **하드코딩된 관리자 계정 제거**: 데이터베이스에 적절히 해싱된 비밀번호로 관리자 계정을 저장하고, 모든 계정에 대해 동일한 검증 프로세스를 적용
2. **로그인 API 완성**: validateCredentials 메서드를 사용하여 사용자 인증을 구현
3. **강력한 비밀번호 정책 적용**: zod 스키마를 확장하여 더 강력한 비밀번호 요구사항을 적용
4. **로그에서 민감 정보 제거**: 디버깅 목적으로도 비밀번호를 로그에 기록하지 않도록 수정
5. **비밀번호 재설정 기능 추가**: 사용자가 비밀번호를 잊어버린 경우를 위한 안전한 재설정 메커니즘 구현
6. **비밀번호 만료 정책**: 정기적인 비밀번호 변경을 요구하는 정책 고려
7. **2단계 인증 도입**: 중요한 관리자 계정에 추가 보안 레이어 제공 