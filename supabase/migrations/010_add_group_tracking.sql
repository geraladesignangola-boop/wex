-- Migration 010: Adicionar colunas de controle de grupo WhatsApp
-- Objetivo: Rastrear quando e por quem cada participante foi adicionado ao grupo

-- Adicionar colunas de controle
ALTER TABLE inscricoes 
ADD COLUMN group_added_at TIMESTAMPTZ,
ADD COLUMN group_added_by UUID REFERENCES admins(id);

-- Criar índice para consultas rápidas
CREATE INDEX idx_inscricoes_group_added ON inscricoes(group_added_at);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN inscricoes.group_added_at IS 'Data/hora em que o participante foi adicionado ao grupo WhatsApp';
COMMENT ON COLUMN inscricoes.group_added_by IS 'ID do admin que adicionou o participante ao grupo';
