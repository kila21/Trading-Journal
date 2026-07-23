export type SetupStatus = "active" | "testing" | "retired";

// Shape of a setup as returned by /api/setups.
export interface SetupDTO {
  id: string;
  name: string;
  description: string | null;
  status: SetupStatus;
  conditions: string[];
  stopRule: string | null;
  targetRule: string | null;
  minR: number | null;
  sessions: string[];
  instruments: string[];
}

// Server-side validated shape for creating/updating a setup (same fields as
// SetupDTO minus `id`, since that's assigned by the database).
export interface SetupInput {
  name: string;
  description: string | null;
  status: SetupStatus;
  conditions: string[];
  stopRule: string | null;
  targetRule: string | null;
  minR: number | null;
  sessions: string[];
  instruments: string[];
}
