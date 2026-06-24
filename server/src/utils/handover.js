import { Handover } from '../models/Handover.js';

// This build manages a single property (Centre Point Amravati). We resolve
// "the" handover as the earliest-created document. The data model already
// scopes everything by handover id, so adding a selector later is cheap.
export async function getCurrentHandover() {
  return Handover.findOne().sort({ createdAt: 1 });
}
