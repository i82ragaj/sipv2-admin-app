// Refleja Contracts/CounterConfigs/*.cs (CounterConfigDto, CreateCounterConfigRequest, UpdateCounterConfigRequest)

export interface CounterConfig {
  id: string;
  isActive: boolean;
  idpk: string;
  counterId: string;
  counterName: string | null;
  occupancyLimit: number | null;
  counterType: string | null;
}

export interface CreateCounterConfigRequest {
  idpk: string;
  counterId: string;
  counterName: string | null;
  occupancyLimit: number | null;
  counterType: string | null;
}

export interface UpdateCounterConfigRequest {
  isActive: boolean;
  counterName: string | null;
  occupancyLimit: number | null;
  counterType: string | null;
}
