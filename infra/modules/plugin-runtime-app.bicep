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
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identityId}': {} }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 3001
        transport: 'http'
        allowInsecure: false
      }
      registries: [{ server: registryServer, identity: identityId }]
    }
    template: {
      containers: [{
        name: 'plugin-runtime'
        image: imageName
        env: [
          { name: 'HOST', value: '0.0.0.0' }
          { name: 'PORT', value: '3001' }
          { name: 'PLUGIN_ARTIFACT_ROOT', value: '/app/artifacts/plugin/runtime' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
        probes: [
          {
            type: 'Liveness'
            httpGet: { path: '/healthz', port: 3001 }
            initialDelaySeconds: 5
            periodSeconds: 10
          }
          {
            type: 'Readiness'
            httpGet: { path: '/readyz', port: 3001 }
            initialDelaySeconds: 2
            periodSeconds: 5
          }
        ]
      }]
      scale: {
        minReplicas: minReplicas
        maxReplicas: 1
        rules: [{
          name: 'http'
          http: { metadata: { concurrentRequests: '20' } }
        }]
      }
    }
  }
}

output fqdn string = app.properties.configuration.ingress.fqdn
