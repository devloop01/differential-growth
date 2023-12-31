export const defaultSettings = {
  MinDistance: 20,
  MaxDistance: 30,
  RepulsionRadius: 20,
  MaxVelocity: 0.1,
  AttractionForce: 0.001,
  RepulsionForce: 500,
  AlignmentForce: 0.001,
  NodeInjectionInterval: 100,
  DrawNodes: false,
  TraceMode: false,
  InvertedColors: false,
  DebugMode: false,
  FillMode: false,
  DrawHistory: false,
  HistoryCaptureInterval: 1000,
  MaxHistorySize: 10,
  UseBrownianMotion: true,
  BrownianMotionRange: 0.01,
  ShowBound: true,
};

export const settings = {
  ...defaultSettings,
  MinDistance: 5,
  MaxDistance: 11,
  RepulsionRadius: 20,
  MaxVelocity: 0.18,
  AttractionForce: 0.3,
  RepulsionForce: 0.9,
  AlignmentForce: 0.45,
  NodeInjectionInterval: 100,
  BrownianMotionRange: 0.05,
  DrawNodes: false,
  TraceMode: false,
  InvertedColors: false,
  DebugMode: false,
  FillMode: false,
  ShowBound: false,
};
