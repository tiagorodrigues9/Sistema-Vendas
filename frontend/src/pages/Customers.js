import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, User, Mail, Phone, MapPin, Check, RefreshCw, AlertTriangle, X, AlertCircle, FileText } from 'lucide-react';
import { customersAPI, salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  
  // Estados para vendas do cliente
  const [showCustomerSales, setShowCustomerSales] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);
  const [loadingCustomerSales, setLoadingCustomerSales] = useState(false);
  const [selectedCustomerForSales, setSelectedCustomerForSales] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    document: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: ''
  });

  // Estados para validação e feedback
  const [formErrors, setFormErrors] = useState({});
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [duplicatedCustomer, setDuplicatedCustomer] = useState(null);
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Carregar clientes
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      const allCustomers = response?.data?.customers || [];
      
      setCustomers(allCustomers.filter(c => !c.isDeleted));
      setDeletedCustomers(allCustomers.filter(c => c.isDeleted));
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
      setCustomers([]);
      setDeletedCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Filtrar clientes
  const filteredCustomers = searchTerm.trim() === '' 
    ? customers 
    : customers.filter(customer =>
        customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Formatar CPF/CNPJ
  const formatDocument = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 11) {
      // CPF: 000.000.000-00
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    } else {
      // CNPJ: 00.000.000/0000-00
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }
  };

  // Formatar telefone
  const formatPhone = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 10) {
      // (00) 0000-0000
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    } else {
      // (00) 00000-0000
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }
  };

  // Formatar CEP
  const formatZipCode = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  // Validação de CPF
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cpf.charAt(10));
  };

  // Validação de CNPJ
  const validateCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    
    const calculateDigit = (cnpj, weights) => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights[i];
      }
      let remainder = 11 - (sum % 11);
      return remainder === 10 || remainder === 11 ? 0 : remainder;
    };
    
    const digit1 = calculateDigit(cnpj, weights1);
    const digit2 = calculateDigit(cnpj, weights2);
    
    return digit1 === parseInt(cnpj.charAt(12)) && digit2 === parseInt(cnpj.charAt(13));
  };

  // Validação de documento (CPF/CNPJ)
  const validateDocument = (doc) => {
    const cleanDoc = doc.replace(/\D/g, '');
    if (cleanDoc.length === 0) return { valid: true, message: '' };
    if (cleanDoc.length === 11) {
      return {
        valid: validateCPF(cleanDoc),
        message: validateCPF(cleanDoc) ? '' : 'CPF inválido'
      };
    } else if (cleanDoc.length === 14) {
      return {
        valid: validateCNPJ(cleanDoc),
        message: validateCNPJ(cleanDoc) ? '' : 'CNPJ inválido'
      };
    }
    return { valid: false, message: 'CPF/CNPJ incompleto' };
  };

  // Validação de email
  const validateEmail = (email) => {
    if (!email || email.trim() === '') return { valid: true, message: '' };
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: re.test(email),
      message: re.test(email) ? '' : 'Email inválido'
    };
  };

  // Validação de telefone
  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 0) return { valid: true, message: '' };
    if (cleanPhone.length < 10) {
      return { valid: false, message: 'Telefone incompleto' };
    }
    return { valid: true, message: '' };
  };

  // Validação de CEP
  const validateZipCode = (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 0) return { valid: true, message: '' };
    if (cleanCep.length !== 8) {
      return { valid: false, message: 'CEP inválido' };
    }
    return { valid: true, message: '' };
  };

  // Busca de endereço por CEP (ViaCEP)
  const searchAddressByCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: cep
      }));
      
      // Limpar erros dos campos de endereço
      setFormErrors(prev => ({
        ...prev,
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      }));
      
      toast.success('Endereço encontrado automaticamente');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Verificar cliente duplicado
  const checkDuplicateCustomer = (customerData) => {
    const duplicate = customers.find(customer => 
      customer._id !== editingCustomer?._id && (
        (customerData.document && customer.document === customerData.document) ||
        (customerData.email && customerData.email.trim() !== '' && customer.email === customerData.email)
      )
    );
    
    if (duplicate) {
      setDuplicatedCustomer(duplicate);
      return true;
    }
    
    setDuplicatedCustomer(null);
    return false;
  };

  // Validação completa do formulário
  const validateForm = () => {
    const errors = {};
    
    // Nome obrigatório
    if (!formData.fullName.trim()) {
      errors.fullName = 'Nome é obrigatório';
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    // Documento
    const docValidation = validateDocument(formData.document);
    if (!docValidation.valid) {
      errors.document = docValidation.message;
    }
    
    // Email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.message;
    }
    
    // Telefone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.message;
    }
    
    // CEP
    const cepValidation = validateZipCode(formData.zipCode);
    if (!cepValidation.valid) {
      errors.zipCode = cepValidation.message;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Lidar com mudanças nos campos com formatação e validação
  const handleDocumentChange = (e) => {
    const formatted = formatDocument(e.target.value);
    setFormData({ ...formData, document: formatted });
    setHasUnsavedChanges(true);
    
    // Validar em tempo real
    const validation = validateDocument(formatted);
    setFormErrors(prev => ({
      ...prev,
      document: validation.valid ? '' : validation.message
    }));
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    setHasUnsavedChanges(true);
    
    // Validar em tempo real
    const validation = validatePhone(formatted);
    setFormErrors(prev => ({
      ...prev,
      phone: validation.valid ? '' : validation.message
    }));
  };

  const handleZipCodeChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData({ ...formData, zipCode: formatted });
    setHasUnsavedChanges(true);
    
    // Validar em tempo real
    const validation = validateZipCode(formatted);
    setFormErrors(prev => ({
      ...prev,
      zipCode: validation.valid ? '' : validation.message
    }));
    
    // Buscar endereço se CEP estiver completo
    if (formatted.replace(/\D/g, '').length === 8) {
      searchAddressByCep(formatted);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    setHasUnsavedChanges(true);
    
    // Validar em tempo real (apenas se não estiver vazio)
    if (email.trim() !== '') {
      const validation = validateEmail(email);
      setFormErrors(prev => ({
        ...prev,
        email: validation.valid ? '' : validation.message
      }));
    } else {
      // Limpar erro se estiver vazio
      setFormErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({ ...formData, fullName: name });
    setHasUnsavedChanges(true);
    
    // Validar em tempo real
    setFormErrors(prev => ({
      ...prev,
      fullName: name.trim().length >= 3 ? '' : (name.trim() ? '' : 'Nome é obrigatório')
    }));
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasUnsavedChanges(true);
    
    // Limpar erro do campo
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  // Carregar vendas do cliente
  const loadCustomerSales = async (customerId) => {
    setLoadingCustomerSales(true);
    try {
      // Buscar vendas do cliente usando a API
      const response = await salesAPI.getAll({ customer: customerId });
      const salesData = response?.data?.sales || [];
      
      // Formatar vendas para exibição
      const formattedSales = salesData.map(sale => ({
        id: sale._id,
        saleNumber: sale.saleNumber,
        date: new Date(sale.createdAt).toLocaleDateString('pt-BR'),
        time: new Date(sale.createdAt).toLocaleTimeString('pt-BR'),
        total: sale.total,
        status: sale.status,
        paymentMethods: sale.payments || [],
        items: sale.items || []
      }));
      
      setCustomerSales(formattedSales);
    } catch (error) {
      console.error('Erro ao carregar vendas do cliente:', error);
      toast.error('Erro ao carregar vendas do cliente');
      setCustomerSales([]);
    } finally {
      setLoadingCustomerSales(false);
    }
  };

  // Ver vendas do cliente
  const viewCustomerSales = (customer) => {
    setSelectedCustomerForSales(customer);
    setShowCustomerSales(true);
    loadCustomerSales(customer._id);
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Obter label da forma de pagamento
  const getPaymentMethodLabel = (method) => {
    const labels = {
      dinheiro: 'Dinheiro',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      pix: 'PIX',
      boleto: 'Boleto',
      promissoria: 'Promissória',
      parcelado: 'Parcelado'
    };
    return labels[method] || method;
  };
  const resetForm = () => {
    setFormData({
      fullName: '',
      document: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: ''
    });
    setEditingCustomer(null);
    setFormErrors({});
    setHasUnsavedChanges(false);
    setDuplicatedCustomer(null);
  };

  // Abrir formulário
  const openForm = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        fullName: customer.fullName || '',
        document: customer.document || '',
        address: customer.address || '',
        neighborhood: customer.neighborhood || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        phone: customer.phone || '',
        email: customer.email || ''
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  // Salvar cliente
  const handleSave = async () => {
    // Validar formulário completo
    if (!validateForm()) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }
    
    // Verificar duplicados
    if (checkDuplicateCustomer(formData)) {
      toast.error('Cliente já cadastrado com este CPF/CNPJ ou email');
      return;
    }
    
    // Limpar campos vazios antes de enviar
    const cleanFormData = {
      ...formData,
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      document: formData.document?.trim() || null,
      address: formData.address?.trim() || null,
      neighborhood: formData.neighborhood?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      zipCode: formData.zipCode?.trim() || null
    };
    
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer._id, cleanFormData);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await customersAPI.create(cleanFormData);
        toast.success('Cliente criado com sucesso');
      }
      
      setShowForm(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      
      // Tratar erros de validação específicos
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Mostrar o primeiro erro de validação
          const firstError = errorData.errors[0];
          toast.error(firstError.msg);
        } else if (errorData.message) {
          // Mostrar mensagem de erro geral
          toast.error(errorData.message);
        } else {
          toast.error('Erro de validação. Verifique os dados informados.');
        }
      } else {
        toast.error('Erro ao salvar cliente');
      }
    }
  };

  // Excluir cliente
  const handleDelete = async (customerId) => {
    try {
      await customersAPI.delete(customerId);
      toast.success('Cliente excluído com sucesso');
      loadCustomers();
      setShowTrash(false);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  // Restaurar cliente
  const handleRestore = async (customerId) => {
    try {
      await customersAPI.restore(customerId);
      toast.success('Cliente restaurado com sucesso');
      loadCustomers();
    } catch (error) {
      console.error('Erro ao restaurar cliente:', error);
      toast.error('Erro ao restaurar cliente');
    }
  };

  // Ordenar clientes
  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  // Obter clientes ordenados e filtrados
  const getSortedAndFilteredCustomers = () => {
    let filtered = searchTerm.trim() === '' 
      ? customers 
      : customers.filter(customer =>
          customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Converter para string para comparação
      aValue = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
      bValue = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Exportar clientes para CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Nome', 'Documento', 'Email', 'Telefone', 'Endereço', 'Bairro', 'Cidade', 'Estado', 'CEP', 'Total Compras'],
      ...getSortedAndFilteredCustomers().map(customer => [
        customer.fullName || '',
        customer.document || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.neighborhood || '',
        customer.city || '',
        customer.state || '',
        customer.zipCode || '',
        customer.totalPurchases || 0
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Lista de clientes exportada com sucesso');
  };

  // Confirmar fechamento com alterações não salvas
  const handleCloseForm = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Tem alterações não salvas. Deseja realmente fechar?')) {
        setShowForm(false);
        resetForm();
      }
    } else {
      setShowForm(false);
      resetForm();
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showForm) {
        // Ctrl+S para salvar
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        // Escape para fechar
        if (e.key === 'Escape') {
          handleCloseForm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm, hasUnsavedChanges, formData, editingCustomer]);

  if (loading) {
    return (
      <div className="container-responsive">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
            title="Exportar para CSV"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exp.</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Atual.</span>
          </button>
          <button
            onClick={() => openForm()}
            className="btn btn-primary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content py-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome, documento, email ou telefone..."
              className="input pl-10 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lista de Clientes</h3>
        </div>
        <div className="card-content">
          {getSortedAndFilteredCustomers().length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm.trim() ? 'Nenhum cliente encontrado para esta pesquisa' : 'Nenhum cliente cadastrado'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                      >
                        Nome
                        {sortBy === 'fullName' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('document')}
                        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                      >
                        Documento
                        {sortBy === 'document' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">Contato</th>
                    <th className="text-left py-3 px-4">Endereço</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedAndFilteredCustomers().map((customer) => (
                    <tr key={customer._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <p className="font-medium">{customer.fullName}</p>
                            <p className="text-xs text-gray-500">
                              Total compras: {customer.totalPurchases || 0}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.document || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{customer.address || 'N/A'}</p>
                          {customer.neighborhood && (
                            <p className="text-gray-500">
                              {customer.neighborhood}, {customer.city}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => viewCustomerSales(customer)}
                            className="btn btn-secondary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Ver Vendas"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openForm(customer)}
                            className="btn btn-primary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setShowTrash(true);
                            }}
                            className="btn btn-danger h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Clientes Excluídos */}
      {deletedCustomers.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Clientes Excluídos</h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Documento</th>
                    <th className="text-left py-3 px-4">Data Exclusão</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedCustomers.map((customer) => (
                    <tr key={customer._id} className="border-b bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="line-through">{customer.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.document || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {customer.deletedAt ? new Date(customer.deletedAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleRestore(customer._id)}
                            className="btn btn-secondary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Restaurar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Alerta de cliente duplicado */}
            {duplicatedCustomer && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Cliente possivelmente duplicado
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Já existe um cliente cadastrado com o mesmo CPF/CNPJ ou email: {duplicatedCustomer.fullName}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input ${formErrors.fullName ? 'border-red-500' : ''}`}
                      value={formData.fullName}
                      onChange={handleNameChange}
                      required
                      autoFocus
                    />
                    {formErrors.fullName && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                        {formErrors.fullName}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input ${formErrors.document ? 'border-red-500' : ''}`}
                      value={formData.document}
                      onChange={handleDocumentChange}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                    {formErrors.document && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                        {formErrors.document}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      className={`input ${formErrors.email ? 'border-red-500' : ''}`}
                      value={formData.email}
                      onChange={handleEmailChange}
                      placeholder="email@exemplo.com"
                    />
                    {formErrors.email && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                        {formErrors.email}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      className={`input ${formErrors.phone ? 'border-red-500' : ''}`}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                    />
                    {formErrors.phone && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                        {formErrors.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder={isSearchingCep ? 'Buscando endereço...' : 'Rua, Avenida, etc.'}
                  disabled={isSearchingCep}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.neighborhood}
                    onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                    placeholder="Centro"
                    disabled={isSearchingCep}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="São Paulo"
                    disabled={isSearchingCep}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.state}
                    onChange={(e) => handleFieldChange('state', e.target.value.toUpperCase())}
                    maxLength="2"
                    placeholder="SP"
                    disabled={isSearchingCep}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`input ${formErrors.zipCode ? 'border-red-500' : ''}`}
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    placeholder="00000-000"
                  />
                  {isSearchingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                  {formErrors.zipCode && (
                    <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                      {formErrors.zipCode}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-xs text-gray-500">
                <p>• Campos com * são obrigatórios</p>
                <p>• Ctrl+S para salvar • Esc para fechar</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseForm}
                  className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                  disabled={!formData.fullName || Object.keys(formErrors).some(key => formErrors[key])}
                >
                  {editingCustomer ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showTrash && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o cliente "<span className="font-medium">{editingCustomer.fullName}</span>"? 
              Esta ação poderá ser desfeita posteriormente.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTrash(false)}
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(editingCustomer._id)}
                className="btn btn-danger h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vendas do Cliente */}
      {showCustomerSales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Vendas do Cliente</h2>
                {selectedCustomerForSales && (
                  <p className="text-gray-600 mt-1">
                    {selectedCustomerForSales.fullName} - {customerSales.length} vendas
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCustomerSales(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingCustomerSales ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {customerSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma venda encontrada para este cliente
                  </div>
                ) : (
                  <>
                    {/* Resumo */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total de Vendas</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.total, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quantidade</p>
                          <p className="text-xl font-bold">{customerSales.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ticket Médio</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.total, 0) / customerSales.length)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Vendas */}
                    <div className="space-y-2">
                      {customerSales.map((sale) => (
                        <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">Venda #{sale.saleNumber}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  sale.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {sale.status === 'completed' ? 'Concluída' : 'Pendente'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Data/Hora:</span> {sale.date} {sale.time}
                                </div>
                                <div>
                                  <span className="font-medium">Cliente:</span> {selectedCustomerForSales?.fullName}
                                </div>
                                <div>
                                  <span className="font-medium">Total:</span> 
                                  <span className="text-green-600 font-bold ml-1">
                                    {formatCurrency(sale.total)}
                                  </span>
                                </div>
                              </div>

                              {/* Formas de Pagamento */}
                              {sale.paymentMethods.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {sale.paymentMethods.map((method, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {getPaymentMethodLabel(method.method)}: {formatCurrency(method.amount)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Itens da Venda */}
                              {sale.items.length > 0 && (
                                <div className="mt-3 text-sm">
                                  <details className="cursor-pointer">
                                    <summary className="font-medium text-gray-700 hover:text-gray-900">
                                      Ver itens ({sale.items.length})
                                    </summary>
                                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
                                      {sale.items.map((item, index) => (
                                        <div key={index} className="text-gray-600">
                                          {item.quantity}x {item.description} - {formatCurrency(item.totalValue)}
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCustomerSales(false)}
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
