import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
export class PermissionService {
  constructor(private readonly work: UnitOfWork) {}
  list() {
    return this.work.query((repositories) => repositories.permissions.list());
  }
}
