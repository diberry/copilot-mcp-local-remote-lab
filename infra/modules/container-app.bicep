param name string
param location string
param tags object
param environmentId string
param identityId string
param registryServer string
param imageName string
param minReplicas int
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${identityId}': {} } }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: { external: true, targetPort: 3000, transport: 'http', allowInsecure: false }
      registries: [{ server: registryServer, identity: identityId }]
    }
    template: {
      containers: [{
        name: 'mcp'
        image: imageName
        env: [{ name: 'HOST', value: '0.0.0.0' }, { name: 'PORT', value: '3000' }]
        resources: { cpu: json('0.5'), memory: '1Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/healthz', port: 3000 }, initialDelaySeconds: 5, periodSeconds: 10 }
          { type: 'Readiness', httpGet: { path: '/readyz', port: 3000 }, initialDelaySeconds: 2, periodSeconds: 5 }
        ]
      }]
      scale: { minReplicas: minReplicas, maxReplicas: 2, rules: [{ name: 'http', http: { metadata: { concurrentRequests: '20' } } }] }
    }
  }
}
output fqdn string = app.properties.configuration.ingress.fqdn
