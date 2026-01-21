# 영수증 분석 모델 (Receipt Analysis Model)

Qwen3-VL-2B-Instruct 기반 영수증 금액/날짜 추출 모델

## 개요

- **베이스 모델**: `Qwen/Qwen3-VL-2B-Instruct`
- **학습 방법**: LoRA (Low-Rank Adaptation)
- **서빙**: vLLM
- **추출 정보**: 금액 (amount), 날짜 (date), 통화 (currency)

## 프로젝트 구조

```
model/
├── README.md              # 이 파일
├── requirements.txt       # Python 의존성
├── scripts/
│   ├── prepare_dataset.py # 데이터셋 전처리
│   ├── finetune.py        # 파인튜닝 스크립트
│   └── evaluate.py        # 성능 평가 스크립트
├── configs/
│   └── finetune_config.yaml  # 학습 설정
├── data/
│   ├── raw/               # 원본 영수증 이미지
│   ├── processed/         # 전처리된 데이터
│   └── annotations/       # 라벨링 데이터 (JSON)
└── serving/
    └── vllm_config.yaml   # vLLM 서빙 설정
```

## 빠른 시작

### 1. 환경 설정

```bash
cd model
pip install -r requirements.txt
```

### 2. 데이터셋 준비

**공개 데이터셋 다운로드 (택1):**

- **SROIE**: [GitHub - SROIE](https://github.com/zzzDavid/ICDAR-2019-SROIE)
- **CORD**: [GitHub - CORD](https://github.com/clovaai/cord)

**데이터셋 전처리:**

```bash
# SROIE 데이터셋 사용 시
python scripts/prepare_dataset.py \
    --source sroie \
    --data_dir ./data/raw/sroie \
    --output_dir ./data/processed

# CORD 데이터셋 사용 시
python scripts/prepare_dataset.py \
    --source cord \
    --data_dir ./data/raw/cord \
    --output_dir ./data/processed

# 커스텀 데이터셋 사용 시
python scripts/prepare_dataset.py \
    --source custom \
    --data_dir ./data/raw/custom \
    --output_dir ./data/processed
```

**커스텀 데이터셋 형식:**

```
data/raw/custom/
├── images/
│   ├── receipt_001.jpg
│   └── receipt_002.jpg
└── annotations.json
```

`annotations.json`:
```json
[
  {
    "image": "receipt_001.jpg",
    "amount": 15000,
    "date": "2025-01-15",
    "currency": "KRW"
  }
]
```

### 3. 모델 파인튜닝

```bash
python scripts/finetune.py --config configs/finetune_config.yaml
```

**주요 설정 (configs/finetune_config.yaml):**

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `lora.r` | 64 | LoRA rank |
| `lora.lora_alpha` | 128 | LoRA alpha |
| `training.num_epochs` | 3 | 학습 에포크 |
| `training.learning_rate` | 2e-4 | 학습률 |
| `hardware.use_4bit` | false | 4비트 양자화 (VRAM 부족 시 true) |

**GPU 메모리 요구사항:**

- BF16 (기본): ~12-16GB VRAM (RTX 3090 권장)
- 4비트 양자화: ~8-10GB VRAM (VRAM 부족 시)

### 4. 모델 평가

```bash
python scripts/evaluate.py \
    --model_path ./output/qwen3-vl-2b-receipt \
    --test_data ./data/processed/test.json \
    --image_dir ./data/processed/images
```

**목표 성능:**

| 지표 | 목표 |
|------|------|
| 금액 추출 정확도 | > 90% |
| 날짜 추출 정확도 | > 85% |
| 평균 응답 시간 | < 3초 |

### 5. vLLM 서빙

**LoRA 가중치 병합 (선택사항):**

```bash
# 병합 스크립트 (별도 작성 필요)
python scripts/merge_lora.py \
    --base_model Qwen/Qwen3-VL-2B-Instruct \
    --lora_path ./output/qwen3-vl-2b-receipt-lora \
    --output_path ./output/qwen3-vl-2b-receipt-merged
```

**서버 실행:**

```bash
vllm serve ./output/qwen3-vl-2b-receipt-merged \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 4096 \
    --trust-remote-code
```

**API 테스트:**

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-vl-2b-receipt",
    "messages": [
      {"role": "user", "content": [
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQ..."}},
        {"type": "text", "text": "이 영수증에서 총 금액과 날짜를 추출해주세요."}
      ]}
    ],
    "max_tokens": 256
  }'
```

**응답 예시:**

```json
{
  "choices": [{
    "message": {
      "content": "{\"amount\": 15000, \"date\": \"2025-01-15\", \"currency\": \"KRW\"}"
    }
  }]
}
```

## 학습 모니터링

Wandb를 사용한 학습 모니터링:

```yaml
# configs/finetune_config.yaml
wandb:
  enabled: true
  project: "receipt-analysis"
  run_name: "qwen3-vl-2b-receipt-lora"
```

환경 변수 설정:
```bash
export WANDB_API_KEY="your-api-key"
```

## 트러블슈팅

### CUDA Out of Memory

1. `gradient_accumulation_steps` 증가
2. `per_device_train_batch_size` 감소
3. 4비트 양자화 활성화 (`use_4bit: true`)

### 학습이 불안정한 경우

1. `learning_rate` 감소 (예: 1e-4)
2. `warmup_ratio` 증가 (예: 0.1)
3. `gradient_checkpointing` 활성화

### vLLM 서빙 오류

1. `trust_remote_code: true` 확인
2. 모델 경로 확인
3. GPU 메모리 확인 (`gpu_memory_utilization` 조정)

## 라이선스

이 프로젝트는 Qwen 모델의 라이선스를 따릅니다.
