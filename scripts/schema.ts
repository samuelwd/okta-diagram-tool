// Writes spec.schema.json from the zod spec, for editor autocomplete and validation in JSON
// specs: add "$schema": "../spec.schema.json" (path relative to the spec) at the top.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { SpecSchema } from "../system";

const schema = z.toJSONSchema(SpecSchema, { io: "input", unrepresentable: "any" });
writeFileSync(join(import.meta.dir, "..", "spec.schema.json"), JSON.stringify(schema, null, 2) + "\n");
console.log("spec.schema.json");
