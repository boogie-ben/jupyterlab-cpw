// export const isDev = import.meta.env.MODE === 'dev'
export const isDev = window.location.host !== 'lab.devops.tencent-cep.com'

export const PROJECT_ID = isDev ? 1 : (Number(window.location.pathname.split('/')[4]?.replace('project_', '')) ?? 1)

console.log('PROJECT_ID', Number(window.location.pathname.split('/')[4]?.replace('project_', '')))
