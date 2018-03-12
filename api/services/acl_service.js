export default class Acl {
  constructor(swaggerObject) {
    console.log('Constructing ACL');

    this.rules = {};

    this.rulesDefinition = swaggerObject['x-acl-rules'] || {};

    // zostavime si objekt so vsetkymi operaciami (tie ktore maju operationId a security)
    const swaggerOperations = {};
    Object.keys(swaggerObject.paths).map(path => {
      Object.keys(swaggerObject.paths[path]).map(method => {
        const { operationId } = swaggerObject.paths[path][method];
        if (operationId && swaggerObject.paths[path][method].security) {
          swaggerOperations[operationId] = swaggerObject.paths[path][method];
        }
        return method;
      });
      return path;
    });

    // prejdeme vsetkymi pravidalmi a spravim z nich jednoduche pravidla,
    // ktore obsahuju len operationId
    Object.keys(this.rulesDefinition).map(role => {
      const rules = {};
      if (this.rulesDefinition[role].isSuperadmin) {
        // doplnime vsetky operations
        Object.keys(swaggerOperations).map(operationId => {
          rules[operationId] = true;
          return operationId;
        });
      } else if (this.rulesDefinition[role].includeTags) {
        this.rulesDefinition[role].includeTags.map(tag => {
          Object.keys(swaggerOperations).map(operationId => {
            if (
              swaggerOperations[operationId].tags &&
              swaggerOperations[operationId].tags.indexOf(tag) >= 0
            ) {
              rules[operationId] = true;
            }
            return operationId;
          });
          return tag;
        });
      } else if (this.rulesDefinition[role].excludeTags) {
        this.rulesDefinition[role].excludeTags.map(tag => {
          Object.keys(swaggerOperations).map(operationId => {
            if (
              swaggerOperations[operationId].tags &&
              swaggerOperations[operationId].tags.indexOf(tag) >= 0
            ) {
              rules[operationId] = false;
            }
            return operationId;
          });
          return tag;
        });
      }
      this.rules[role] = rules;
      return role;
    });

    // nastavime extendovanie a explicitne definovane pravidla
    Object.keys(this.rulesDefinition).map(role => {
      if (this.rulesDefinition[role].extends) {
        this.rulesDefinition[role].extends.map(extendRole => {
          console.log(`Extending ${role} by ${extendRole}`);
          this.rules[role] = Object.assign(
            this.rules[role],
            this.rules[extendRole],
          );
          return extendRole;
        });
      }
      // explicitne nastavene pravidla = prepise vsetko
      this.rules[role] = Object.assign(
        this.rules[role],
        this.rulesDefinition[role].rules || {},
      );
      return role;
    });
  }

  getRoleAcl(role) {
    return Object.assign({}, this.rules[role] || {});
  }

  isAllowed(role, operationId) {
    // najskor si zistime rolu
    return Object.v4k(this.getRoleAcl(role), operationId, false);
  }
}
